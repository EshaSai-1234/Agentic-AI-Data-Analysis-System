import numpy as np
import pandas as pd
from typing import Dict, Any, List

class InsightGenerationAgent:
    """
    Agent for synthesizing statistical facts, patterns, and anomalies
    into strategic, human-readable executive insights.
    """

    @classmethod
    def synthesize_dataset_insights(
        cls,
        dataset_name: str,
        profile_data: Dict[str, Any],
        eda_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        insights = []

        row_count = profile_data.get("row_count", 0)
        quality = profile_data.get("quality_score", {}).get("overall_score", 100)
        grade = profile_data.get("quality_score", {}).get("grade", "A")

        # 1. Quality & Health Insight
        insights.append({
            "category": "Data Health",
            "title": f"Dataset Maturity & Integrity: Grade {grade} ({quality}/100)",
            "description": f"Dataset contains {row_count:,} records across {profile_data.get('column_count', 0)} attributes. "
                           f"{'Data is clean and ready for production modeling.' if quality >= 85 else 'Action recommended to resolve missing values or outliers.'}",
            "severity": "positive" if quality >= 85 else "warning"
        })

        # 2. Correlation Insights
        top_corrs = eda_data.get("top_correlations", [])
        if top_corrs:
            strongest = top_corrs[0]
            corr_val = strongest.get("correlation", 0.0)
            c1 = strongest.get("col1", "")
            c2 = strongest.get("col2", "")
            direction = "positive direct" if corr_val > 0 else "inverse"

            insights.append({
                "category": "Correlation & Causality Signals",
                "title": f"Strong Association: {c1} & {c2} (r = {corr_val})",
                "description": f"There is a notable {direction} linear relationship between '{c1}' and '{c2}'. "
                               f"Increases in '{c1}' are strongly linked to changes in '{c2}'.",
                "severity": "info"
            })

        # 3. Distribution & Outlier Insight
        distributions = eda_data.get("distributions", {})
        skewed_cols = []
        for col, dist in distributions.items():
            if dist.get("max", 0) > dist.get("mean", 0) + 3 * max(dist.get("std", 0), 1):
                skewed_cols.append(col)

        if skewed_cols:
            insights.append({
                "category": "Distribution & Outliers",
                "title": f"Right-Tail Heavy Metrics Detected ({', '.join(skewed_cols[:2])})",
                "description": f"Top performers or high-value anomalies heavily pull the mean upwards. "
                               f"Median should be used as the primary baseline KPI rather than mean.",
                "severity": "warning"
            })

        # 4. Strategic Recommendation
        insights.append({
            "category": "Strategic Action",
            "title": "Actionable Next Steps",
            "description": "Deploy automated predictive models or segment cohorts based on identified high-impact drivers to maximize conversion and operational efficiency.",
            "severity": "info"
        })

        return insights

insight_agent = InsightGenerationAgent()
