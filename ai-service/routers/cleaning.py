import os
import uuid
from fastapi import APIRouter, HTTPException, Query
from models.schemas import CleaningPlanRequest, CleaningPlanResponse, ApplyCleaningRequest, ApplyCleaningResponse
from services.dataset_loader import DatasetLoader
from agents.cleaning_agent import cleaning_agent
from config import settings

router = APIRouter(prefix="/cleaning", tags=["Data Cleaning"])

@router.get("/recommendations", response_model=CleaningPlanResponse)
def get_cleaning_recommendations(file_path: str = Query(..., description="Path to dataset")):
    try:
        df = DatasetLoader.load_dataset(file_path)
        return cleaning_agent.generate_recommendations(df)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate recommendations: {str(e)}")

@router.post("/apply", response_model=ApplyCleaningResponse)
def apply_cleaning_steps(request: ApplyCleaningRequest):
    try:
        df = DatasetLoader.load_dataset(request.file_path)
        
        # Target output filename
        out_name = request.output_name or f"cleaned_{uuid.uuid4().hex[:6]}.csv"
        out_path = os.path.join(settings.STORAGE_DIR, out_name)

        return cleaning_agent.apply_cleaning(df, request.steps, out_path)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cleaning operation failed: {str(e)}")
