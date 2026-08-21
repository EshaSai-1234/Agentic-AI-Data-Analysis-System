export interface DatasetSummary {
  id: number;
  name: string;
  originalFilename: string;
  fileFormat: string;
  fileSizeBytes: number;
  rowCount: number;
  columnCount: number;
  qualityScore: number;
  qualityGrade: string;
  description?: string;
  createdAt: string;
}

export interface ColumnSummary {
  id?: number;
  columnName: string;
  dataType: string;
  inferredType: string; // numeric, categorical, datetime, text, boolean
  nullCount: number;
  nullPercentage: number;
  distinctCount: number;
  isPrimaryKeyCandidate?: boolean;
  minValue?: string | number;
  maxValue?: string | number;
  meanVal?: number;
  medianVal?: number;
  stdDev?: number;
}

export interface QualityScore {
  overall_score: number;
  completeness_score: number;
  uniqueness_score: number;
  validity_score: number;
  consistency_score: number;
  grade: string;
  summary: string;
  critical_issues: string[];
  recommendations: string[];
}

export interface DatasetDetail {
  summary: DatasetSummary;
  columns: ColumnSummary[];
  previewData: Record<string, any>[];
  qualityBreakdown?: QualityScore;
  recommendedVisualizations?: any[];
}

export interface ChatMessage {
  id: number;
  sender: 'USER' | 'ASSISTANT';
  queryText: string;
  explanation?: string;
  intent?: string;
  chartType?: string;
  chartConfig?: any;
  stats?: Record<string, any>;
  safeCodeSnippet?: string;
  executionTimeMs?: number;
  limitations?: string;
  suggestedFollowups?: string[];
  resultData?: Record<string, any>[];
  createdAt: string;
}

export interface CleaningStep {
  action: string;
  column?: string;
  strategy?: string;
  fillValue?: any;
  targetType?: string;
}

export interface CleaningPlan {
  recommended_steps: CleaningStep[];
  estimated_quality_improvement: number;
  rationale: string[];
}

export interface MLTrainResult {
  model_id: string;
  task_type: string;
  algorithm: string;
  target_column?: string;
  feature_columns: string[];
  metrics: Record<string, any>;
  confusion_matrix?: number[][];
  roc_curve?: { fpr: number[]; tpr: number[] };
  feature_importance?: { feature: string; importance: number }[];
  model_summary: string;
  insights: string[];
}

export interface EDAResult {
  dataset_name: string;
  numeric_columns: string[];
  categorical_columns: string[];
  datetime_columns: string[];
  correlation_matrix: Record<string, Record<string, number>>;
  top_correlations: { col1: string; col2: string; correlation: number; strength: string }[];
  distributions: Record<string, any>;
  categorical_summaries: Record<string, Record<string, number>>;
  key_observations: string[];
}

export interface ReportResult {
  id?: number;
  report_title: string;
  generated_at: string;
  executive_summary: string;
  quality_score: number;
  markdown_content: string;
  html_content: string;
}
