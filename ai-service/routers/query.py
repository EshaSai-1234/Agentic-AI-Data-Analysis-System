from fastapi import APIRouter, HTTPException
from models.schemas import NLQueryRequest, NLQueryResponse
from agents.supervisor import supervisor_agent

router = APIRouter(prefix="/query", tags=["Natural Language Query"])

@router.post("", response_model=NLQueryResponse)
def execute_natural_language_query(request: NLQueryRequest):
    try:
        return supervisor_agent.process_query(request)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query execution failed: {str(e)}")
