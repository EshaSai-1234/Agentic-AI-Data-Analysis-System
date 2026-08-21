from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from models.schemas import DatasetCompareRequest, DatasetCompareResponse
from services.dataset_loader import DatasetLoader
from agents.profiler_agent import profiler_agent

router = APIRouter(prefix="/compare", tags=["Dataset Comparison"])

@router.post("", response_model=DatasetCompareResponse)
def compare_datasets(request: DatasetCompareRequest):
    try:
        df_a = DatasetLoader.load_dataset(request.file_path_a)
        df_b = DatasetLoader.load_dataset(request.file_path_b)

        prof_a = profiler_agent.profile(df_a, request.name_a)
        prof_b = profiler_agent.profile(df_b, request.name_b)

        cols_a = set(df_a.columns)
        cols_b = set(df_b.columns)

        common = list(cols_a.intersection(cols_b))
        only_a = list(cols_a - cols_b)
        only_b = list(cols_b - cols_a)

        score_a = prof_a.quality_score.overall_score
        score_b = prof_b.quality_score.overall_score
        quality_delta = round(score_b - score_a, 1)

        # Column comparison table
        col_comp: List[Dict[str, Any]] = []
        for col in common:
            null_a = int(df_a[col].isna().sum())
            null_b = int(df_b[col].isna().sum())
            col_comp.append({
                "column": col,
                "null_count_a": null_a,
                "null_count_b": null_b,
                "null_delta": null_b - null_a,
                "distinct_a": int(df_a[col].nunique()),
                "distinct_b": int(df_b[col].nunique())
            })

        differences = []
        row_delta = len(df_b) - len(df_a)
        if row_delta != 0:
            differences.append(f"Row count changed by {row_delta:+d} rows ({len(df_a)} -> {len(df_b)}).")
        if only_a:
            differences.append(f"Columns only in {request.name_a}: {', '.join(only_a)}.")
        if only_b:
            differences.append(f"New columns in {request.name_b}: {', '.join(only_b)}.")
        if quality_delta > 0:
            differences.append(f"Quality improved by +{quality_delta}% ({score_a}% -> {score_b}%).")
        elif quality_delta < 0:
            differences.append(f"Quality decreased by {quality_delta}% ({score_a}% -> {score_b}%).")

        return DatasetCompareResponse(
            name_a=request.name_a,
            name_b=request.name_b,
            row_count_a=len(df_a),
            row_count_b=len(df_b),
            row_count_delta=row_delta,
            column_count_a=len(df_a.columns),
            column_count_b=len(df_b.columns),
            common_columns=common,
            columns_only_in_a=only_a,
            columns_only_in_b=only_b,
            quality_score_a=score_a,
            quality_score_b=score_b,
            quality_delta=quality_delta,
            column_comparison=col_comp,
            key_differences=differences
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Comparison failed: {str(e)}")
