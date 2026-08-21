from fastapi import APIRouter, HTTPException
from models.schemas import MLTrainRequest, MLTrainResponse, MLPredictRequest, MLPredictResponse
from services.dataset_loader import DatasetLoader
from agents.ml_agent import ml_agent

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.post("/train", response_model=MLTrainResponse)
def train_auto_ml_model(request: MLTrainRequest):
    try:
        df = DatasetLoader.load_dataset(request.file_path)
        return ml_agent.train_model(
            df=df,
            target_column=request.target_column,
            task_type=request.task_type or "auto",
            feature_columns=request.feature_columns,
            algorithm=request.model_algorithm or "auto",
            test_size=request.test_size
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"ML training failed: {str(e)}")

@router.post("/predict", response_model=MLPredictResponse)
def predict_single_sample(request: MLPredictRequest):
    try:
        return ml_agent.predict(request.model_id, request.input_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {str(e)}")
