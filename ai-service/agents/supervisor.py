import time
import pandas as pd
from typing import Dict, Any, List, Optional
from models.schemas import NLQueryRequest, NLQueryResponse
from services.dataset_loader import DatasetLoader
from services.llm_provider import llm_provider
from sandbox.code_sandbox import CodeSandbox
from agents.profiler_agent import profiler_agent
from agents.viz_agent import viz_agent
from agents.stats_agent import stats_agent

class SupervisorAgent:
    """
    Supervisor Agent coordinating specialized sub-agents:
    - Intent detection & Schema inspection
    - AST-sandboxed safe Pandas analysis execution
    - Visualization generation (Plotly)
    - Statistical diagnostics
    - Natural language explanation & follow-up suggestions
    """

    @classmethod
    def process_query(cls, request: NLQueryRequest) -> NLQueryResponse:
        start_time = time.time()
        
        # 1. Load Dataset
        df = DatasetLoader.load_dataset(request.file_path)
        df_columns = list(df.columns)
        
        # 2. Inspect Column Types
        column_types = {}
        for col in df.columns:
            column_types[col] = profiler_agent._infer_type(df[col])

        # 3. LLM / Heuristic intent and code generation
        sample_records = df.head(5).to_dict(orient="records")
        agent_plan = llm_provider.generate_chat_response(
            query=request.query,
            df_columns=df_columns,
            column_types=column_types,
            sample_records=sample_records,
            chat_history=request.chat_history
        )

        safe_code = agent_plan.get("safe_code_snippet", "df.head(10)")
        intent = agent_plan.get("intent", "general_query")
        chart_type = agent_plan.get("chart_type", "bar")
        rel_cols = agent_plan.get("relevant_columns", df_columns[:2])

        # 4. Safe Sandboxed Execution
        sandbox_res = CodeSandbox.execute_safe_query(df, safe_code)
        
        result_data = None
        result_summary = {}
        chart_config = None
        explanation = agent_plan.get("natural_language_explanation", "")

        if sandbox_res.get("success"):
            formatted = sandbox_res.get("formatted_data")
            raw_res = sandbox_res.get("raw_result")
            result_data = formatted if isinstance(formatted, list) else ([formatted] if formatted is not None else None)

            # Convert result back to temporary DataFrame if needed for visualization & summary stats
            if isinstance(raw_res, pd.DataFrame) and not raw_res.empty:
                # Generate dynamic Plotly Chart
                x_c = raw_res.columns[0]
                y_c = raw_res.columns[1] if len(raw_res.columns) > 1 else raw_res.columns[0]
                chart_config = viz_agent.generate_chart_config(raw_res, chart_type, x_col=x_c, y_col=y_c)

                # Rich Summary Metrics
                numeric_sub = raw_res.select_dtypes(include=["number"])
                if not numeric_sub.empty:
                    first_num = numeric_sub.columns[0]
                    result_summary = {
                        "metric_column": first_num,
                        "mean": round(float(numeric_sub[first_num].mean()), 2),
                        "total": round(float(numeric_sub[first_num].sum()), 2),
                        "max": round(float(numeric_sub[first_num].max()), 2),
                        "min": round(float(numeric_sub[first_num].min()), 2),
                        "count": int(len(raw_res))
                    }
            elif isinstance(raw_res, pd.Series):
                res_df = raw_res.reset_index()
                x_c = res_df.columns[0]
                y_c = res_df.columns[1]
                chart_config = viz_agent.generate_chart_config(res_df, chart_type, x_col=x_c, y_col=y_c)
            
            # Specific enhancements for correlation queries
            if intent == "correlation" and len(rel_cols) >= 2:
                c1, c2 = rel_cols[0], rel_cols[1]
                if pd.api.types.is_numeric_dtype(df[c1]) and pd.api.types.is_numeric_dtype(df[c2]):
                    trend_info = stats_agent.linear_trend(df, c1, c2)
                    r_val = trend_info.get("r_value", 0.0)
                    r_sq = trend_info.get("r_squared", 0.0)
                    sig = trend_info.get("significance", "")
                    direction = trend_info.get("direction", "")

                    result_summary.update({
                        "correlation_r": r_val,
                        "r_squared": r_sq,
                        "trend_direction": direction,
                        "significance": sig
                    })

                    explanation = (
                        f"Found a {direction} correlation (Pearson r = {r_val}, R² = {r_sq}) between '{c1}' and '{c2}'. "
                        f"The relationship is {sig}. "
                        f"The scatter plot displays observed data points alongside the fitted linear regression line."
                    )
        else:
            explanation = f"Analysis query encountered an execution constraint: {sandbox_res.get('error')}. Fallback preview generated."
            result_data = df.head(5).to_dict(orient="records")

        exec_time = round((time.time() - start_time) * 1000, 2)

        return NLQueryResponse(
            query=request.query,
            intent=intent,
            relevant_columns=rel_cols,
            safe_code_snippet=safe_code,
            execution_time_ms=exec_time,
            result_data=result_data,
            result_summary=result_summary,
            chart_type=chart_type,
            chart_config=chart_config,
            natural_language_explanation=explanation,
            limitations=agent_plan.get("limitations"),
            suggested_followups=agent_plan.get("suggested_followups", [])
        )

supervisor_agent = SupervisorAgent()
