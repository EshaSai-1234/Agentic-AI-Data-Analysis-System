from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union

# Column Schema & Statistics
class ColumnProfile(BaseModel):
    name: str
    data_type: str
    inferred_type: str  # numeric, categorical, datetime, text, boolean
    null_count: int
    null_percentage: float
    distinct_count: int
    distinct_percentage: float
    is_primary_key_candidate: bool = False
    sample_values: List[Any] = []
    # Numeric stats
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    mean: Optional[float] = None
    median: Optional[float] = None
    std_dev: Optional[float] = None
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    iqr: Optional[float] = None
    outlier_count: Optional[int] = None
    # Categorical stats
    top_categories: Optional[Dict[str, int]] = None

class DataQualityScore(BaseModel):
    overall_score: float  # 0 to 100
    completeness_score: float
    uniqueness_score: float
    validity_score: float
    consistency_score: float
    grade: str  # A+, A, B, C, D, F
    summary: str
    critical_issues: List[str] = []
    recommendations: List[str] = []

class ProfileResponse(BaseModel):
    dataset_name: str
    row_count: int
    column_count: int
    memory_usage_kb: float
    duplicate_rows_count: int
    duplicate_rows_percentage: float
    columns: List[ColumnProfile]
    quality_score: DataQualityScore
    preview_data: List[Dict[str, Any]]
    recommended_visualizations: List[Dict[str, Any]] = []

# Cleaning
class CleaningStep(BaseModel):
    action: str  # drop_duplicates, impute_missing, remove_outliers, cap_outliers, drop_columns, cast_type, rename_column
    column: Optional[str] = None
    strategy: Optional[str] = None  # mean, median, mode, constant, drop_row, winsorize, z_score, iqr
    fill_value: Optional[Any] = None
    target_type: Optional[str] = None

class CleaningPlanRequest(BaseModel):
    file_path: str
    steps: Optional[List[CleaningStep]] = None
    auto_generate: bool = True

class CleaningPlanResponse(BaseModel):
    recommended_steps: List[CleaningStep]
    estimated_quality_improvement: float
    rationale: List[str]

class ApplyCleaningRequest(BaseModel):
    file_path: str
    steps: List[CleaningStep]
    output_name: Optional[str] = None

class ApplyCleaningResponse(BaseModel):
    success: bool
    cleaned_file_path: str
    original_row_count: int
    new_row_count: int
    original_column_count: int
    new_column_count: int
    quality_score_before: float
    quality_score_after: float
    applied_steps_summary: List[str]
    preview_data: List[Dict[str, Any]]

# EDA
class EDARequest(BaseModel):
    file_path: str
    selected_columns: Optional[List[str]] = None

class CorrelationItem(BaseModel):
    col1: str
    col2: str
    correlation: float
    strength: str  # strong_positive, moderate_positive, weak, moderate_negative, strong_negative

class EDAResponse(BaseModel):
    dataset_name: str
    numeric_columns: List[str]
    categorical_columns: List[str]
    datetime_columns: List[str]
    correlation_matrix: Dict[str, Dict[str, float]]
    top_correlations: List[CorrelationItem]
    distributions: Dict[str, Any]
    categorical_summaries: Dict[str, Dict[str, int]]
    key_observations: List[str]

# Natural Language Query
class NLQueryRequest(BaseModel):
    file_path: str
    query: str
    chat_history: Optional[List[Dict[str, str]]] = []
    dataset_context: Optional[Dict[str, Any]] = None

class NLQueryResponse(BaseModel):
    query: str
    intent: str
    relevant_columns: List[str]
    safe_code_snippet: str
    execution_time_ms: float
    result_data: Optional[List[Dict[str, Any]]] = None
    result_summary: Dict[str, Any] = {}
    chart_type: Optional[str] = None
    chart_config: Optional[Dict[str, Any]] = None
    natural_language_explanation: str
    limitations: Optional[str] = None
    suggested_followups: List[str] = []

# Machine Learning
class MLTrainRequest(BaseModel):
    file_path: str
    target_column: str
    task_type: Optional[str] = "auto"  # auto, classification, regression, clustering, anomaly_detection
    feature_columns: Optional[List[str]] = None
    model_algorithm: Optional[str] = "auto"  # auto, random_forest, linear_regression, logistic_regression, xgboost, k_means, isolation_forest
    test_size: float = 0.2
    hyperparameters: Optional[Dict[str, Any]] = None

class MLTrainResponse(BaseModel):
    model_id: str
    task_type: str
    algorithm: str
    target_column: Optional[str] = None
    feature_columns: List[str]
    metrics: Dict[str, Any]  # accuracy, precision, recall, f1, r2, rmse, mae, silhouette_score, anomaly_count
    confusion_matrix: Optional[List[List[int]]] = None
    roc_curve: Optional[Dict[str, List[float]]] = None
    feature_importance: Optional[List[Dict[str, Any]]] = None
    model_summary: str
    insights: List[str]

class MLPredictRequest(BaseModel):
    model_id: str
    input_data: Dict[str, Any]

class MLPredictResponse(BaseModel):
    prediction: Any
    probabilities: Optional[Dict[str, float]] = None
    explanation: str

# Report Generation
class ReportGenerateRequest(BaseModel):
    file_path: str
    dataset_name: str
    include_sections: Optional[List[str]] = ["summary", "quality", "eda", "insights", "recommendations"]
    custom_title: Optional[str] = None

class ReportGenerateResponse(BaseModel):
    report_title: str
    generated_at: str
    executive_summary: str
    quality_score: float
    sections: List[Dict[str, Any]]
    markdown_content: str
    html_content: str

# Dataset Comparison
class DatasetCompareRequest(BaseModel):
    file_path_a: str
    file_path_b: str
    name_a: Optional[str] = "Dataset A"
    name_b: Optional[str] = "Dataset B"

class DatasetCompareResponse(BaseModel):
    name_a: str
    name_b: str
    row_count_a: int
    row_count_b: int
    row_count_delta: int
    column_count_a: int
    column_count_b: int
    common_columns: List[str]
    columns_only_in_a: List[str]
    columns_only_in_b: List[str]
    quality_score_a: float
    quality_score_b: float
    quality_delta: float
    column_comparison: List[Dict[str, Any]]
    key_differences: List[str]
