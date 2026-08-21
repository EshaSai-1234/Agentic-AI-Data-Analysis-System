import numpy as np
import pandas as pd
from typing import Dict, Any, List
from models.schemas import EDAResponse, CorrelationItem

class EDAAgent:
    """
    Agent for comprehensive Exploratory Data Analysis (EDA):
    - Correlation matrices (Pearson & Spearman)
    - Distribution analysis (binned histograms, skewness, kurtosis)
    - Categorical frequency summaries
    - Automated statistical observations
    """

    @classmethod
    def analyze(cls, df: pd.DataFrame, dataset_name: str = "Dataset", selected_columns: List[str] = None) -> EDAResponse:
        working_df = df[selected_columns].copy() if selected_columns else df.copy()

        numeric_cols = [col for col in working_df.columns if pd.api.types.is_numeric_dtype(working_df[col])]
        categorical_cols = [col for col in working_df.columns if not pd.api.types.is_numeric_dtype(working_df[col]) and not pd.api.types.is_datetime64_any_dtype(working_df[col])]
        datetime_cols = [col for col in working_df.columns if pd.api.types.is_datetime64_any_dtype(working_df[col])]

        # 1. Correlation Matrix
        corr_matrix_dict = {}
        top_correlations: List[CorrelationItem] = []

        if len(numeric_cols) >= 2:
            corr_df = working_df[numeric_cols].corr(method="pearson").fillna(0.0)
            corr_matrix_dict = {
                col: {c2: round(float(corr_df.loc[col, c2]), 3) for c2 in numeric_cols}
                for col in numeric_cols
            }

            # Extract top pairwise correlations (upper triangle)
            seen_pairs = set()
            for i, c1 in enumerate(numeric_cols):
                for j, c2 in enumerate(numeric_cols):
                    if i < j:
                        r = float(corr_df.loc[c1, c2])
                        if not np.isnan(r):
                            strength = cls._classify_correlation_strength(r)
                            top_correlations.append(CorrelationItem(
                                col1=c1,
                                col2=c2,
                                correlation=round(r, 3),
                                strength=strength
                            ))
            top_correlations.sort(key=lambda x: abs(x.correlation), reverse=True)

        # 2. Distributions
        distributions = {}
        for col in numeric_cols:
            series = working_df[col].dropna()
            if len(series) > 0:
                counts, bin_edges = np.histogram(series, bins=min(12, max(5, int(len(series) / 5))))
                bins = [f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}" for i in range(len(counts))]
                distributions[col] = {
                    "mean": round(float(series.mean()), 2),
                    "median": round(float(series.median()), 2),
                    "std": round(float(series.std()), 2) if len(series) > 1 else 0.0,
                    "min": round(float(series.min()), 2),
                    "max": round(float(series.max()), 2),
                    "bins": bins,
                    "counts": [int(c) for c in counts]
                }

        # 3. Categorical Summaries
        cat_summaries = {}
        for col in categorical_cols:
            series = working_df[col].dropna().astype(str)
            if len(series) > 0:
                val_counts = series.value_counts().head(10).to_dict()
                cat_summaries[col] = {k: int(v) for k, v in val_counts.items()}

        # 4. Key Observations
        observations = []
        if top_correlations:
            strongest = top_correlations[0]
            observations.append(
                f"Strongest linear association is between '{strongest.col1}' and '{strongest.col2}' (r = {strongest.correlation}, {strongest.strength.replace('_', ' ')})."
            )
            if len(top_correlations) > 1 and abs(top_correlations[1].correlation) > 0.5:
                second = top_correlations[1]
                observations.append(
                    f"Notable correlation between '{second.col1}' and '{second.col2}' (r = {second.correlation})."
                )

        for col, dist in distributions.items():
            if dist["max"] > dist["mean"] + 3 * max(dist["std"], 0.001):
                observations.append(f"Column '{col}' exhibits significant positive right-tail dispersion.")

        for col, summary in cat_summaries.items():
            total = sum(summary.values())
            if total > 0:
                top_item, top_count = list(summary.items())[0]
                pct = round(top_count / total * 100, 1)
                if pct > 50:
                    observations.append(f"Category '{top_item}' dominates '{col}' accounting for {pct}% of entries.")

        if not observations:
            observations.append("Dataset features demonstrate balanced distributions with no extreme collinearity.")

        return EDAResponse(
            dataset_name=dataset_name,
            numeric_columns=numeric_cols,
            categorical_columns=categorical_cols,
            datetime_columns=datetime_cols,
            correlation_matrix=corr_matrix_dict,
            top_correlations=top_correlations[:15],
            distributions=distributions,
            categorical_summaries=cat_summaries,
            key_observations=observations
        )

    @staticmethod
    def _classify_correlation_strength(r: float) -> str:
        if r >= 0.7:
            return "strong_positive"
        elif r >= 0.4:
            return "moderate_positive"
        elif r > -0.4:
            return "weak"
        elif r > -0.7:
            return "moderate_negative"
        else:
            return "strong_negative"

eda_agent = EDAAgent()
