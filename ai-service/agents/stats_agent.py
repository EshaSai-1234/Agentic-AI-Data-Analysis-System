import math
import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, Any, List, Optional

class StatisticalAnalysisAgent:
    """
    Agent for deep statistical hypothesis testing and numerical diagnostics:
    - Linear regression trend analysis (slope, intercept, R², p-value, stderr)
    - Two-sample T-test
    - One-way ANOVA
    - Percentile distributions (p10, p25, p50, p75, p90, p99)
    """

    @classmethod
    def linear_trend(cls, df: pd.DataFrame, x_col: str, y_col: str) -> Dict[str, Any]:
        subset = df[[x_col, y_col]].dropna()
        if len(subset) < 2:
            return {"error": "Insufficient data points for trend analysis"}

        try:
            x_vals = pd.to_numeric(subset[x_col], errors="coerce").fillna(0).values
            y_vals = pd.to_numeric(subset[y_col], errors="coerce").fillna(0).values

            slope, intercept, r_value, p_value, std_err = stats.linregress(x_vals, y_vals)
            r_squared = r_value ** 2

            direction = "positive" if slope > 0 else "negative" if slope < 0 else "neutral"
            significance = "statistically significant (p < 0.05)" if p_value < 0.05 else "not statistically significant (p >= 0.05)"

            return {
                "x_column": x_col,
                "y_column": y_col,
                "slope": round(float(slope), 4),
                "intercept": round(float(intercept), 4),
                "r_value": round(float(r_value), 4),
                "r_squared": round(float(r_squared), 4),
                "p_value": float(f"{p_value:.4e}"),
                "std_err": round(float(std_err), 4),
                "direction": direction,
                "significance": significance,
                "summary": f"Linear trend from '{x_col}' to '{y_col}' is {direction} with R² = {round(r_squared, 3)} ({significance})."
            }
        except Exception as e:
            return {"error": f"Failed to compute trend: {str(e)}"}

    @classmethod
    def hypothesis_test(
        cls,
        df: pd.DataFrame,
        numeric_col: str,
        group_col: str,
        test_type: str = "auto"
    ) -> Dict[str, Any]:
        subset = df[[numeric_col, group_col]].dropna()
        groups = subset[group_col].unique()

        if len(groups) < 2:
            return {"error": f"Group column '{group_col}' has fewer than 2 distinct categories."}

        group_data = [subset[subset[group_col] == g][numeric_col].values for g in groups]

        try:
            if len(groups) == 2 or test_type == "t_test":
                t_stat, p_val = stats.ttest_ind(group_data[0], group_data[1], equal_var=False)
                is_sig = p_val < 0.05
                return {
                    "test": "Welch's Two-Sample T-Test",
                    "group_column": group_col,
                    "numeric_column": numeric_col,
                    "groups": [str(g) for g in groups[:2]],
                    "statistic": round(float(t_stat), 4),
                    "p_value": float(f"{p_val:.4e}"),
                    "is_significant": is_sig,
                    "conclusion": (
                        f"There is a statistically significant difference in '{numeric_col}' across '{group_col}' groups (p = {p_val:.4e})."
                        if is_sig else
                        f"No statistically significant difference in '{numeric_col}' across '{group_col}' groups was detected (p = {p_val:.4e})."
                    )
                }
            else:
                f_stat, p_val = stats.f_oneway(*group_data)
                is_sig = p_val < 0.05
                return {
                    "test": "One-Way ANOVA",
                    "group_column": group_col,
                    "numeric_column": numeric_col,
                    "groups_count": len(groups),
                    "f_statistic": round(float(f_stat), 4),
                    "p_value": float(f"{p_val:.4e}"),
                    "is_significant": is_sig,
                    "conclusion": (
                        f"Statistically significant variance exists for '{numeric_col}' across {len(groups)} '{group_col}' groups (F = {round(f_stat, 2)}, p = {p_val:.4e})."
                        if is_sig else
                        f"No significant variance in '{numeric_col}' across '{group_col}' groups (p = {p_val:.4e})."
                    )
                }
        except Exception as e:
            return {"error": f"Hypothesis testing error: {str(e)}"}

    @classmethod
    def percentiles(cls, df: pd.DataFrame, column: str) -> Dict[str, float]:
        series = pd.to_numeric(df[column], errors="coerce").dropna()
        if len(series) == 0:
            return {}
        p = np.percentile(series, [10, 25, 50, 75, 90, 99])
        return {
            "p10": round(float(p[0]), 2),
            "p25": round(float(p[1]), 2),
            "p50_median": round(float(p[2]), 2),
            "p75": round(float(p[3]), 2),
            "p90": round(float(p[4]), 2),
            "p99": round(float(p[5]), 2)
        }

stats_agent = StatisticalAnalysisAgent()
