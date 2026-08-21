import numpy as np
import pandas as pd
from typing import Dict, Any, List
from models.schemas import ColumnProfile, DataQualityScore, ProfileResponse

class ProfilerAgent:
    """
    Agent responsible for deep data profiling, schema inference,
    outlier detection, and overall Data Quality Score calculation.
    """

    @classmethod
    def profile(cls, df: pd.DataFrame, dataset_name: str = "Dataset") -> ProfileResponse:
        row_count = len(df)
        col_count = len(df.columns)
        memory_bytes = df.memory_usage(deep=True).sum()
        memory_kb = round(memory_bytes / 1024.0, 2)
        
        duplicate_rows_count = int(df.duplicated().sum())
        duplicate_rows_pct = round((duplicate_rows_count / row_count * 100) if row_count > 0 else 0.0, 2)

        column_profiles: List[ColumnProfile] = []
        total_cells = max(row_count * col_count, 1)
        total_nulls = 0
        total_outliers = 0

        for col in df.columns:
            series = df[col]
            null_count = int(series.isna().sum())
            total_nulls += null_count
            null_pct = round((null_count / row_count * 100) if row_count > 0 else 0.0, 2)
            
            non_null = series.dropna()
            distinct_count = int(non_null.nunique())
            distinct_pct = round((distinct_count / row_count * 100) if row_count > 0 else 0.0, 2)
            is_pk = (distinct_count == row_count and null_count == 0 and row_count > 0)

            # Inferred Type
            inferred_type = cls._infer_type(series)
            
            profile = ColumnProfile(
                name=col,
                data_type=str(series.dtype),
                inferred_type=inferred_type,
                null_count=null_count,
                null_percentage=null_pct,
                distinct_count=distinct_count,
                distinct_percentage=distinct_pct,
                is_primary_key_candidate=is_pk,
                sample_values=[v for v in non_null.head(5).tolist()]
            )

            # Numeric profiling
            if inferred_type == "numeric" and len(non_null) > 0:
                numeric_series = pd.to_numeric(non_null, errors="coerce").dropna()
                if len(numeric_series) > 0:
                    profile.min_value = round(float(numeric_series.min()), 4)
                    profile.max_value = round(float(numeric_series.max()), 4)
                    profile.mean = round(float(numeric_series.mean()), 4)
                    profile.median = round(float(numeric_series.median()), 4)
                    profile.std_dev = round(float(numeric_series.std()), 4) if len(numeric_series) > 1 else 0.0
                    profile.skewness = round(float(numeric_series.skew()), 4) if len(numeric_series) > 2 else 0.0
                    profile.kurtosis = round(float(numeric_series.kurtosis()), 4) if len(numeric_series) > 3 else 0.0

                    q25 = float(numeric_series.quantile(0.25))
                    q75 = float(numeric_series.quantile(0.75))
                    iqr = q75 - q25
                    profile.iqr = round(iqr, 4)

                    lower_bound = q25 - 1.5 * iqr
                    upper_bound = q75 + 1.5 * iqr
                    outliers = numeric_series[(numeric_series < lower_bound) | (numeric_series > upper_bound)]
                    outlier_count = int(len(outliers))
                    profile.outlier_count = outlier_count
                    total_outliers += outlier_count

            # Categorical profiling
            elif inferred_type in ["categorical", "boolean"] and len(non_null) > 0:
                top_counts = non_null.astype(str).value_counts().head(8).to_dict()
                profile.top_categories = {k: int(v) for k, v in top_counts.items()}

            column_profiles.append(profile)

        # Calculate Data Quality Score
        quality_score = cls._compute_quality_score(
            row_count, col_count, total_nulls, total_cells, duplicate_rows_count, total_outliers, column_profiles
        )

        # Recommended Visualizations
        recommended_viz = cls._recommend_visualizations(column_profiles)

        preview_records = df.head(15).replace({np.nan: None}).to_dict(orient="records")

        return ProfileResponse(
            dataset_name=dataset_name,
            row_count=row_count,
            column_count=col_count,
            memory_usage_kb=memory_kb,
            duplicate_rows_count=duplicate_rows_count,
            duplicate_rows_percentage=duplicate_rows_pct,
            columns=column_profiles,
            quality_score=quality_score,
            preview_data=preview_records,
            recommended_visualizations=recommended_viz
        )

    @staticmethod
    def _infer_type(series: pd.Series) -> str:
        if pd.api.types.is_numeric_dtype(series):
            if series.dropna().nunique() <= 2 and series.dropna().isin([0, 1]).all():
                return "boolean"
            return "numeric"
        elif pd.api.types.is_datetime64_any_dtype(series):
            return "datetime"
        elif pd.api.types.is_bool_dtype(series):
            return "boolean"
        else:
            # Check if strings can be parsed to dates or numbers
            sample = series.dropna().head(20).astype(str)
            if sample.empty:
                return "text"
            
            # Check boolean
            if sample.str.lower().isin(["true", "false", "yes", "no", "0", "1"]).all():
                return "boolean"
            
            # Check numeric string
            try:
                pd.to_numeric(sample)
                return "numeric"
            except (ValueError, TypeError):
                pass
            
            # Check date string
            try:
                pd.to_datetime(sample, format="mixed")
                return "datetime"
            except (ValueError, TypeError):
                pass

            if series.nunique() <= 25 or series.nunique() / max(len(series), 1) < 0.3:
                return "categorical"
            return "text"

    @staticmethod
    def _compute_quality_score(
        row_count: int,
        col_count: int,
        total_nulls: int,
        total_cells: int,
        duplicate_rows: int,
        total_outliers: int,
        columns: List[ColumnProfile]
    ) -> DataQualityScore:
        completeness = max(0.0, min(100.0, (1.0 - (total_nulls / total_cells)) * 100.0))
        uniqueness = max(0.0, min(100.0, (1.0 - (duplicate_rows / max(row_count, 1))) * 100.0))
        
        # Validity based on outlier ratio and proper typing
        outlier_ratio = min(1.0, total_outliers / max(total_cells, 1))
        validity = max(0.0, min(100.0, (1.0 - (outlier_ratio * 3)) * 100.0))
        consistency = 95.0 if col_count > 0 else 50.0

        overall = round(0.40 * completeness + 0.30 * uniqueness + 0.20 * validity + 0.10 * consistency, 1)

        critical_issues = []
        recommendations = []

        if completeness < 90.0:
            critical_issues.append(f"High volume of missing values ({total_nulls} null cells, {round(100 - completeness, 1)}% missing).")
            recommendations.append("Impute missing numeric values using median/mean or drop non-informative columns.")

        if duplicate_rows > 0:
            critical_issues.append(f"Found {duplicate_rows} duplicate rows in dataset.")
            recommendations.append("Remove redundant duplicate rows to avoid data leakage in statistical and ML models.")

        if total_outliers > 0:
            recommendations.append(f"Detected {total_outliers} statistical outliers across numeric columns. Consider winsorizing or clipping extreme values.")

        for col in columns:
            if col.null_percentage > 40.0:
                critical_issues.append(f"Column '{col.name}' has {col.null_percentage}% missing values.")
            if col.inferred_type == "numeric" and col.skewness and abs(col.skewness) > 2.0:
                recommendations.append(f"Column '{col.name}' is heavily skewed ({col.skewness}). Consider applying a log transform before regression.")

        if overall >= 95:
            grade = "A+"
        elif overall >= 90:
            grade = "A"
        elif overall >= 80:
            grade = "B"
        elif overall >= 70:
            grade = "C"
        elif overall >= 60:
            grade = "D"
        else:
            grade = "F"

        summary = f"Dataset quality scored {overall}/100 (Grade {grade}). Completeness: {round(completeness, 1)}%, Uniqueness: {round(uniqueness, 1)}%."

        return DataQualityScore(
            overall_score=overall,
            completeness_score=round(completeness, 1),
            uniqueness_score=round(uniqueness, 1),
            validity_score=round(validity, 1),
            consistency_score=round(consistency, 1),
            grade=grade,
            summary=summary,
            critical_issues=critical_issues,
            recommendations=recommendations
        )

    @staticmethod
    def _recommend_visualizations(columns: List[ColumnProfile]) -> List[Dict[str, Any]]:
        numeric_cols = [c.name for c in columns if c.inferred_type == "numeric"]
        cat_cols = [c.name for c in columns if c.inferred_type == "categorical"]
        date_cols = [c.name for c in columns if c.inferred_type == "datetime"]

        recommendations = []

        # 1. Trend/Line if datetime and numeric
        if date_cols and numeric_cols:
            recommendations.append({
                "type": "line",
                "title": f"{numeric_cols[0]} over {date_cols[0]}",
                "x_axis": date_cols[0],
                "y_axis": numeric_cols[0],
                "description": "Visualize temporal trends and seasonal fluctuations."
            })

        # 2. Bar chart if categorical and numeric
        if cat_cols and numeric_cols:
            recommendations.append({
                "type": "bar",
                "title": f"{numeric_cols[0]} by {cat_cols[0]}",
                "x_axis": cat_cols[0],
                "y_axis": numeric_cols[0],
                "description": f"Compare aggregate {numeric_cols[0]} across {cat_cols[0]} groups."
            })

        # 3. Scatter plot if at least 2 numeric columns
        if len(numeric_cols) >= 2:
            recommendations.append({
                "type": "scatter",
                "title": f"{numeric_cols[0]} vs {numeric_cols[1]}",
                "x_axis": numeric_cols[0],
                "y_axis": numeric_cols[1],
                "description": "Analyze linear or non-linear correlation and cluster formation."
            })

        # 4. Box plot for distribution & outliers
        if numeric_cols:
            recommendations.append({
                "type": "box",
                "title": f"Distribution & Outliers: {numeric_cols[0]}",
                "x_axis": cat_cols[0] if cat_cols else None,
                "y_axis": numeric_cols[0],
                "description": "Inspect quartiles, median, and outlier dispersion."
            })

        # 5. Correlation Heatmap
        if len(numeric_cols) >= 3:
            recommendations.append({
                "type": "heatmap",
                "title": "Numeric Feature Correlation Heatmap",
                "description": "Comprehensive pairwise Pearson correlation matrix."
            })

        return recommendations

profiler_agent = ProfilerAgent()
