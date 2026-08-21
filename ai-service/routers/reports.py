from fastapi import APIRouter, HTTPException
from models.schemas import ReportGenerateRequest, ReportGenerateResponse
from services.dataset_loader import DatasetLoader
from agents.profiler_agent import profiler_agent
from agents.eda_agent import eda_agent
from agents.report_agent import report_agent

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate", response_model=ReportGenerateResponse)
def generate_dataset_report(request: ReportGenerateRequest):
    try:
        df = DatasetLoader.load_dataset(request.file_path)
        profile_res = profiler_agent.profile(df, dataset_name=request.dataset_name)
        eda_res = eda_agent.analyze(df, dataset_name=request.dataset_name)

        return report_agent.generate_report(
            dataset_name=request.dataset_name,
            profile_data=profile_res.model_dump(),
            eda_data=eda_res.model_dump(),
            custom_title=request.custom_title
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Report generation failed: {str(e)}")
