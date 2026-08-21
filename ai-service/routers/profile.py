from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models.schemas import ProfileResponse
from services.dataset_loader import DatasetLoader
from agents.profiler_agent import profiler_agent

router = APIRouter(prefix="/profile", tags=["Profiling"])

@router.get("", response_model=ProfileResponse)
def profile_dataset(file_path: str = Query(..., description="Absolute path to CSV or Excel file"), name: Optional[str] = "Dataset"):
    try:
        df = DatasetLoader.load_dataset(file_path)
        return profiler_agent.profile(df, dataset_name=name)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Profiling failed: {str(e)}")
