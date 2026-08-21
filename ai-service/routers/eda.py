from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from models.schemas import EDAResponse
from services.dataset_loader import DatasetLoader
from agents.eda_agent import eda_agent

router = APIRouter(prefix="/eda", tags=["Exploratory Data Analysis"])

@router.get("", response_model=EDAResponse)
def get_eda_analysis(
    file_path: str = Query(..., description="Path to dataset"),
    name: Optional[str] = "Dataset",
    columns: Optional[str] = Query(None, description="Comma-separated selected columns")
):
    try:
        df = DatasetLoader.load_dataset(file_path)
        col_list = [c.strip() for c in columns.split(",")] if columns else None
        return eda_agent.analyze(df, dataset_name=name, selected_columns=col_list)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"EDA calculation failed: {str(e)}")
