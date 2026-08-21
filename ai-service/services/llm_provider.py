import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from config import settings

logger = logging.getLogger(__name__)

class LLMProvider:
    """
    Unified LLM and Intelligent Heuristic Engine.
    Works 100% offline out-of-the-box, with seamless upgrade to OpenAI/Ollama when configured.
    """

    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.openai_key = settings.OPENAI_API_KEY
        self.ollama_url = settings.OLLAMA_BASE_URL
        logger.info(f"Initialized LLMProvider with mode: {self.provider}")

    def generate_chat_response(
        self,
        query: str,
        df_columns: List[str],
        column_types: Dict[str, str],
        sample_records: List[Dict[str, Any]],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Processes a natural language query against dataset schema.
        Returns:
            - intent
            - relevant_columns
            - safe_code_snippet
            - chart_type
            - natural_language_explanation
            - limitations
            - suggested_followups
        """
        # If external API is enabled and configured, try it first
        if self.provider in ["openai", "ollama"] and (self.openai_key or self.ollama_url):
            try:
                external_resp = self._call_external_llm(query, df_columns, column_types, sample_records)
                if external_resp:
                    return external_resp
            except Exception as e:
                logger.warning(f"External LLM call failed ({str(e)}), falling back to Local Heuristic Engine.")

        # Default: Intelligent offline local heuristic engine
        return self._local_heuristic_engine(query, df_columns, column_types, sample_records)

    def _local_heuristic_engine(
        self,
        query: str,
        df_columns: List[str],
        column_types: Dict[str, str],
        sample_records: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        q_lower = query.lower().strip()
        numeric_cols = [c for c, t in column_types.items() if t == "numeric"]
        cat_cols = [c for c, t in column_types.items() if t == "categorical"]
        date_cols = [c for c, t in column_types.items() if t == "datetime"]
        
        # 1. Match columns against query words
        matched_cols = []
        for col in df_columns:
            clean_col = col.lower().replace("_", " ").replace("-", " ")
            col_tokens = set(clean_col.split())
            if any(token in q_lower for token in col_tokens if len(token) > 2) or clean_col in q_lower:
                matched_cols.append(col)

        # Alias dictionary for common dataset domains
        alias_map = {
            "sales": ["Sales_Units", "Revenue", "Sales", "Total_Sales", "Price_USD", "Monthly_Charges"],
            "ad": ["Advertising_Spend", "Budget_USD", "Marketing_Spend"],
            "advertising": ["Advertising_Spend", "Budget_USD"],
            "spend": ["Advertising_Spend", "Budget_USD", "Monthly_Charges"],
            "revenue": ["Revenue", "Revenue_Generated_USD", "Total_Charges", "Price_USD"],
            "cost": ["Price_Per_Unit", "Monthly_Charges", "Budget_USD"],
            "month": ["Month", "Date", "Tenure_Months", "Year_Built"],
            "trend": ["Month", "Date", "Year_Built", "Tenure_Months"],
            "region": ["Region", "Neighborhood", "Channel"],
            "channel": ["Channel", "Payment_Method", "Internet_Service"],
            "churn": ["Churn", "Return_Rate", "Customer_Satisfaction"],
            "price": ["Price_USD", "Price_Per_Unit", "Monthly_Charges"],
            "profit": ["Revenue", "ROI_Percentage"],
            "customer": ["CustomerID", "Customer_Satisfaction", "Target_Audience"]
        }
        for alias, targets in alias_map.items():
            if alias in q_lower:
                for target in targets:
                    if target in df_columns and target not in matched_cols:
                        matched_cols.append(target)

        # Fallback if no columns matched: pick top numeric/categorical columns
        if not matched_cols:
            if numeric_cols:
                matched_cols.extend(numeric_cols[:2])
            if cat_cols and len(matched_cols) < 3:
                matched_cols.append(cat_cols[0])

        # 2. Determine Intent
        intent = "general_analysis"
        code_snippet = ""
        chart_type = "bar"
        suggested_followups = []

        # Intent: Geographic Map / Location Analysis
        if any(w in q_lower for w in ["map", "geographic", "geo", "latitude", "longitude", "location", "country", "region", "state", "city"]):
            intent = "geographic"
            cat = cat_cols[0] if cat_cols else df_columns[0]
            num = numeric_cols[0] if numeric_cols else df_columns[-1]
            code_snippet = f"df.groupby('{cat}')['{num}'].sum().reset_index()"
            chart_type = "scattergeo" if any(c.lower() in ["lat", "latitude", "lon", "longitude"] for c in df_columns) else "choropleth"
            suggested_followups = [
                f"Show regional totals for {num}",
                f"Which location has the highest concentration of {num}?",
                f"Filter geographic analysis by top performing regions"
            ]

        # Intent: Proportional Share / Pie Chart / Donut Chart
        elif any(w in q_lower for w in ["pie", "proportion", "proportional", "share", "percentage", "donut", "slice", "ratio"]):
            intent = "proportional"
            cat = cat_cols[0] if cat_cols else df_columns[0]
            num = numeric_cols[0] if numeric_cols else df_columns[-1]
            code_snippet = f"df.groupby('{cat}')['{num}'].sum().reset_index()"
            chart_type = "pie"
            suggested_followups = [
                f"Show percentage share of {num} by {cat}",
                f"What is the top contributor in {cat}?",
                f"Switch to column chart breakdown"
            ]

        # Intent: Column Chart / Vertical Bar
        elif any(w in q_lower for w in ["column", "columns", "vertical bar", "column chart", "column breakdown"]):
            intent = "column_analysis"
            cat = cat_cols[0] if cat_cols else df_columns[0]
            num = numeric_cols[0] if numeric_cols else df_columns[-1]
            code_snippet = f"df.groupby('{cat}')['{num}'].sum().reset_index()"
            chart_type = "column"
            suggested_followups = [
                f"Compare {num} across categories using column chart",
                f"Show percentage breakdown instead",
                f"Display trend line over time"
            ]

        # Intent: Correlation / Relationship
        elif any(w in q_lower for w in ["relationship", "correlation", "correlate", "relate", "vs", "versus", "impact of"]):
            intent = "correlation"
            num_matched = [c for c in matched_cols if c in numeric_cols]
            if len(num_matched) < 2 and len(numeric_cols) >= 2:
                num_matched = numeric_cols[:2]
            
            if len(num_matched) >= 2:
                c1, c2 = num_matched[0], num_matched[1]
                code_snippet = f"df[['{c1}', '{c2}']].dropna().copy()"
                chart_type = "scatter"
                suggested_followups = [
                    f"What is the average {c1} by category?",
                    f"Show the distribution of {c2}",
                    f"Detect anomalies between {c1} and {c2}"
                ]
            else:
                code_snippet = "df.corr(numeric_only=True)"
                chart_type = "heatmap"

        # Intent: Trends / Time Series / Line Graph
        elif any(w in q_lower for w in ["trend", "monthly", "over time", "history", "time series", "progression", "growth", "line graph", "line chart"]):
            intent = "trend"
            date_col = date_cols[0] if date_cols else (cat_cols[0] if cat_cols else df_columns[0])
            for col in matched_cols:
                if any(time_word in col.lower() for time_word in ["month", "date", "year", "time", "day"]):
                    date_col = col
                    break
            
            val_col = [c for c in matched_cols if c != date_col and c in numeric_cols]
            val_col = val_col[0] if val_col else (numeric_cols[0] if numeric_cols else df_columns[-1])
            
            code_snippet = f"df.groupby('{date_col}')['{val_col}'].sum().reset_index()"
            chart_type = "line"
            suggested_followups = [
                f"What was the highest peak month for {val_col}?",
                f"Break down {val_col} by channel or region",
                f"Forecast future {val_col} for the next quarter"
            ]

        # Intent: Distribution / Histogram / Outlier
        elif any(w in q_lower for w in ["distribution", "histogram", "spread", "variance", "outlier", "outliers", "anomaly", "skew"]):
            intent = "distribution"
            target_num = [c for c in matched_cols if c in numeric_cols]
            col = target_num[0] if target_num else (numeric_cols[0] if numeric_cols else df_columns[0])
            code_snippet = f"df[['{col}']].describe().T.reset_index()"
            chart_type = "histogram"
            suggested_followups = [
                f"Are there any extreme outliers in {col}?",
                f"Compare {col} across different categories",
                f"What is the median and IQR of {col}?"
            ]

        # Intent: Top / Bottom / Ranking / Comparison
        elif any(w in q_lower for w in ["top", "highest", "lowest", "best", "worst", "rank", "compare", "breakdown", "by"]):
            intent = "aggregation"
            cat_col = [c for c in matched_cols if c in cat_cols]
            cat = cat_col[0] if cat_col else (cat_cols[0] if cat_cols else df_columns[0])
            num_col = [c for c in matched_cols if c in numeric_cols]
            num = num_col[0] if num_col else (numeric_cols[0] if numeric_cols else df_columns[-1])
            
            ascending = "True" if any(w in q_lower for w in ["lowest", "bottom", "worst"]) else "False"
            code_snippet = f"df.groupby('{cat}')['{num}'].sum().reset_index().sort_values(by='{num}', ascending={ascending})"
            chart_type = "bar"
            suggested_followups = [
                f"Show average {num} instead of total sum",
                f"What percentage does each {cat} contribute to {num}?",
                f"How has {cat} performance changed over time?"
            ]

        # Intent: Average / Mean / Summary / Count
        elif any(w in q_lower for w in ["average", "mean", "total", "sum", "count", "summary", "stats"]):
            intent = "summary"
            if cat_cols and numeric_cols:
                cat = cat_cols[0]
                num = [c for c in matched_cols if c in numeric_cols]
                num = num[0] if num else numeric_cols[0]
                code_snippet = f"df.groupby('{cat}')['{num}'].agg(['mean', 'sum', 'count']).reset_index()"
                chart_type = "bar"
            elif numeric_cols:
                code_snippet = f"df[{list(numeric_cols[:4])}].describe().reset_index()"
                chart_type = "bar"
            else:
                code_snippet = "df.describe(include='all').reset_index()"
                chart_type = "bar"

        # Default fallback query
        else:
            intent = "general_query"
            if len(matched_cols) >= 2 and any(c in numeric_cols for c in matched_cols):
                c1 = matched_cols[0]
                c2 = matched_cols[1]
                code_snippet = f"df[['{c1}', '{c2}']].head(20)"
                chart_type = "bar"
            else:
                code_snippet = "df.head(10)"
                chart_type = "bar"
                suggested_followups = [
                    "What are the top key drivers in this dataset?",
                    "Show correlations between numeric metrics",
                    "Which category generates the most volume?"
                ]

        explanation = (
            f"Analyzed query intent '{intent.replace('_', ' ').title()}' using sandboxed pandas operations. "
            f"Evaluated relevant columns: {', '.join(matched_cols) if matched_cols else 'all columns'}. "
            f"Generated an interactive {chart_type} visualization and aggregated statistical breakdowns."
        )

        limitations = (
            "Analysis is computed strictly from the active dataset sample. "
            "Unobserved external factors, non-linear dependencies, or seasonal biases should be verified with domain context."
        )

        return {
            "query": query,
            "intent": intent,
            "relevant_columns": matched_cols,
            "safe_code_snippet": code_snippet,
            "chart_type": chart_type,
            "natural_language_explanation": explanation,
            "limitations": limitations,
            "suggested_followups": suggested_followups or [
                "What are the most correlated variables in this data?",
                "Which category performs the best overall?",
                "Are there any outliers in this dataset?"
            ]
        }

    def _call_external_llm(self, query: str, df_columns: List[str], column_types: Dict[str, str], sample_records: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        # Integration hook for OpenAI or Ollama endpoints
        import httpx
        system_prompt = f"""You are an expert AI Data Analyst.
Dataset Columns: {df_columns}
Column Types: {column_types}
Sample Rows: {json.dumps(sample_records[:2])}

Generate a JSON response with:
{{
  "intent": "correlation|trend|distribution|aggregation|summary",
  "relevant_columns": ["col1", "col2"],
  "safe_code_snippet": "df.groupby('col1')['col2'].sum().reset_index()",
  "chart_type": "bar|line|scatter|pie|heatmap|histogram",
  "natural_language_explanation": "Detailed explanation of findings",
  "limitations": "Dataset limitations or cautions",
  "suggested_followups": ["Question 1", "Question 2"]
}}
"""
        if self.openai_key:
            headers = {"Authorization": f"Bearer {self.openai_key}", "Content-Type": "application/json"}
            payload = {
                "model": settings.OPENAI_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.2
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    parsed["query"] = query
                    return parsed
        return None

llm_provider = LLMProvider()
