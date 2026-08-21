import os
import pytest
import pandas as pd
from agents.profiler_agent import profiler_agent
from agents.cleaning_agent import cleaning_agent
from agents.eda_agent import eda_agent
from agents.ml_agent import ml_agent
from agents.supervisor import supervisor_agent
from models.schemas import CleaningStep, NLQueryRequest

@pytest.fixture
def sample_df():
    return pd.DataFrame({
        "Month": ["Jan", "Feb", "Mar", "Apr", "May"],
        "Spend": [1000.0, 1500.0, 2000.0, 2500.0, 3000.0],
        "Revenue": [5000.0, 7500.0, 10000.0, 12500.0, 15000.0],
        "Category": ["A", "B", "A", "B", "A"]
    })

def test_profiler_agent(sample_df):
    profile = profiler_agent.profile(sample_df, "Test Dataset")
    assert profile.row_count == 5
    assert profile.column_count == 4
    assert profile.quality_score.overall_score >= 80.0
    assert len(profile.columns) == 4

def test_eda_agent(sample_df):
    eda = eda_agent.analyze(sample_df, "Test Dataset")
    assert "Spend" in eda.correlation_matrix
    # Perfect linear correlation
    corr = eda.correlation_matrix["Spend"]["Revenue"]
    assert abs(corr - 1.0) < 0.01

def test_ml_agent_regression(sample_df):
    train_res = ml_agent.train_model(
        df=sample_df,
        target_column="Revenue",
        task_type="regression",
        feature_columns=["Spend"]
    )
    assert train_res.task_type == "regression"
    assert train_res.metrics["r2_score"] is not None
    assert len(train_res.feature_importance) > 0

    # Test Prediction
    pred_res = ml_agent.predict(train_res.model_id, {"Spend": 4000.0})
    assert pred_res.prediction is not None
    assert float(pred_res.prediction) > 0

def test_ml_agent_classification():
    clf_df = pd.DataFrame({
        "Age": [25, 45, 35, 50, 23, 55, 30, 48],
        "Income": [50000, 120000, 80000, 150000, 45000, 140000, 60000, 110000],
        "Purchased": [0, 1, 0, 1, 0, 1, 0, 1]
    })
    res = ml_agent.train_model(
        df=clf_df,
        target_column="Purchased",
        task_type="classification",
        feature_columns=["Age", "Income"]
    )
    assert res.task_type == "classification"
    assert res.metrics["accuracy"] >= 0.5
    assert len(res.feature_importance) == 2

def test_cleaning_agent():
    dirty_df = pd.DataFrame({
        "A": [1, 2, None, 4, 1],
        "B": ["x", "y", "x", "y", "x"]
    })
    plan = cleaning_agent.generate_recommendations(dirty_df)
    assert len(plan.recommended_steps) > 0

    steps = [
        CleaningStep(action="drop_duplicates"),
        CleaningStep(action="impute_missing", column="A", strategy="mean")
    ]
    
    os.makedirs("./test_storage", exist_ok=True)
    res = cleaning_agent.apply_cleaning(dirty_df, steps, "./test_storage/cleaned_test.csv")
    assert res.success is True
    assert res.new_row_count <= len(dirty_df)
    if os.path.exists("./test_storage/cleaned_test.csv"):
        os.remove("./test_storage/cleaned_test.csv")
