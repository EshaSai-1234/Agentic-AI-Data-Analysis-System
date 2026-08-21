import os
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from models.schemas import CleaningStep, CleaningPlanResponse, ApplyCleaningResponse
from agents.profiler_agent import profiler_agent
from services.dataset_loader import DatasetLoader

class CleaningAgent:
    """
    Agent for recommending and applying data cleaning operations:
    - Missing value imputation (mean, median, mode, constant)
    - Deduplication
    - Outlier handling (Winsorization, IQR clipping, Z-score filter)
    - Type casting & column renaming
    """

    @classmethod
    def generate_recommendations(cls, df: pd.DataFrame) -> CleaningPlanResponse:
        steps: List[CleaningStep] = []
        rationale: List[str] = []
        improvement_estimate = 0.0

        # 1. Check duplicates
        dup_count = int(df.duplicated().sum())
        if dup_count > 0:
            steps.append(CleaningStep(
                action="drop_duplicates",
                strategy="keep_first"
            ))
            rationale.append(f"Remove {dup_count} duplicate rows to improve dataset uniqueness.")
            improvement_estimate += min(15.0, dup_count * 2.0)

        # 2. Check missing values per column
        for col in df.columns:
            null_count = int(df[col].isna().sum())
            if null_count > 0:
                null_pct = null_count / len(df)
                if null_pct > 0.6:
                    steps.append(CleaningStep(
                        action="drop_columns",
                        column=col
                    ))
                    rationale.append(f"Drop column '{col}' due to severe missingness ({round(null_pct*100, 1)}% null).")
                    improvement_estimate += 8.0
                elif pd.api.types.is_numeric_dtype(df[col]):
                    skew = df[col].skew()
                    strategy = "median" if abs(skew) > 1.0 else "mean"
                    steps.append(CleaningStep(
                        action="impute_missing",
                        column=col,
                        strategy=strategy
                    ))
                    rationale.append(f"Impute {null_count} missing values in '{col}' using {strategy} (skewness: {round(skew, 2)}).")
                    improvement_estimate += 5.0
                else:
                    steps.append(CleaningStep(
                        action="impute_missing",
                        column=col,
                        strategy="mode"
                    ))
                    rationale.append(f"Impute {null_count} missing values in categorical column '{col}' using mode.")
                    improvement_estimate += 4.0

        # 3. Check extreme outliers in numeric columns
        for col in df.select_dtypes(include=[np.number]).columns:
            series = df[col].dropna()
            if len(series) > 10:
                q25 = series.quantile(0.25)
                q75 = series.quantile(0.75)
                iqr = q75 - q25
                if iqr > 0:
                    outliers = series[(series < q25 - 2.5 * iqr) | (series > q75 + 2.5 * iqr)]
                    if len(outliers) > 0 and len(outliers) / len(series) < 0.1:
                        steps.append(CleaningStep(
                            action="cap_outliers",
                            column=col,
                            strategy="iqr"
                        ))
                        rationale.append(f"Cap {len(outliers)} extreme outliers in '{col}' to 1.5x IQR boundaries.")
                        improvement_estimate += 3.0

        return CleaningPlanResponse(
            recommended_steps=steps,
            estimated_quality_improvement=round(min(35.0, improvement_estimate), 1),
            rationale=rationale
        )

    @classmethod
    def apply_cleaning(
        cls,
        df: pd.DataFrame,
        steps: List[CleaningStep],
        output_file_path: str
    ) -> ApplyCleaningResponse:
        cleaned_df = df.copy()
        original_rows = len(cleaned_df)
        original_cols = len(cleaned_df.columns)

        # Baseline quality
        profile_before = profiler_agent.profile(cleaned_df, "Before")
        score_before = profile_before.quality_score.overall_score

        applied_summary = []

        for step in steps:
            action = step.action
            col = step.column
            strat = step.strategy or "mean"

            if action == "drop_duplicates":
                before_len = len(cleaned_df)
                cleaned_df = cleaned_df.drop_duplicates()
                dropped = before_len - len(cleaned_df)
                applied_summary.append(f"Removed {dropped} duplicate rows.")

            elif action == "drop_columns" and col in cleaned_df.columns:
                cleaned_df.drop(columns=[col], inplace=True)
                applied_summary.append(f"Dropped column '{col}'.")

            elif action == "impute_missing" and col in cleaned_df.columns:
                if strat == "mean" and pd.api.types.is_numeric_dtype(cleaned_df[col]):
                    val = cleaned_df[col].mean()
                    cleaned_df[col] = cleaned_df[col].fillna(val)
                    applied_summary.append(f"Imputed missing '{col}' with mean ({round(val, 2)}).")
                elif strat == "median" and pd.api.types.is_numeric_dtype(cleaned_df[col]):
                    val = cleaned_df[col].median()
                    cleaned_df[col] = cleaned_df[col].fillna(val)
                    applied_summary.append(f"Imputed missing '{col}' with median ({round(val, 2)}).")
                elif strat == "mode":
                    mode_val = cleaned_df[col].mode()
                    if not mode_val.empty:
                        cleaned_df[col] = cleaned_df[col].fillna(mode_val[0])
                        applied_summary.append(f"Imputed missing '{col}' with mode ('{mode_val[0]}').")
                elif strat == "constant" and step.fill_value is not None:
                    cleaned_df[col] = cleaned_df[col].fillna(step.fill_value)
                    applied_summary.append(f"Imputed missing '{col}' with constant '{step.fill_value}'.")
                elif strat == "drop_row":
                    before_len = len(cleaned_df)
                    cleaned_df = cleaned_df.dropna(subset=[col])
                    applied_summary.append(f"Dropped {before_len - len(cleaned_df)} rows missing '{col}'.")

            elif action in ["cap_outliers", "remove_outliers"] and col in cleaned_df.columns:
                if pd.api.types.is_numeric_dtype(cleaned_df[col]):
                    q25 = cleaned_df[col].quantile(0.25)
                    q75 = cleaned_df[col].quantile(0.75)
                    iqr = q75 - q25
                    lower_limit = q25 - 1.5 * iqr
                    upper_limit = q75 + 1.5 * iqr

                    if action == "cap_outliers":
                        cleaned_df[col] = cleaned_df[col].clip(lower=lower_limit, upper=upper_limit)
                        applied_summary.append(f"Capped outliers in '{col}' to range [{round(lower_limit, 2)}, {round(upper_limit, 2)}].")
                    else:
                        before_len = len(cleaned_df)
                        cleaned_df = cleaned_df[(cleaned_df[col] >= lower_limit) & (cleaned_df[col] <= upper_limit)]
                        applied_summary.append(f"Removed {before_len - len(cleaned_df)} outlier rows from '{col}'.")

            elif action == "cast_type" and col in cleaned_df.columns and step.target_type:
                try:
                    if step.target_type == "numeric":
                        cleaned_df[col] = pd.to_numeric(cleaned_df[col], errors="coerce")
                    elif step.target_type == "datetime":
                        cleaned_df[col] = pd.to_datetime(cleaned_df[col], errors="coerce")
                    elif step.target_type == "string":
                        cleaned_df[col] = cleaned_df[col].astype(str)
                    applied_summary.append(f"Cast '{col}' to {step.target_type}.")
                except Exception as e:
                    applied_summary.append(f"Could not cast '{col}' to {step.target_type}: {str(e)}")

        # Save to output file
        saved_path = DatasetLoader.save_dataset(cleaned_df, output_file_path)

        profile_after = profiler_agent.profile(cleaned_df, "After")
        score_after = profile_after.quality_score.overall_score

        preview = cleaned_df.head(15).replace({np.nan: None}).to_dict(orient="records")

        return ApplyCleaningResponse(
            success=True,
            cleaned_file_path=saved_path,
            original_row_count=original_rows,
            new_row_count=len(cleaned_df),
            original_column_count=original_cols,
            new_column_count=len(cleaned_df.columns),
            quality_score_before=score_before,
            quality_score_after=score_after,
            applied_steps_summary=applied_summary,
            preview_data=preview
        )

cleaning_agent = CleaningAgent()
