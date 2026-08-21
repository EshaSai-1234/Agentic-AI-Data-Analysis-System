-- ==========================================================
-- PostgreSQL Database Schema: Agentic AI Data Analysis Assistant
-- ==========================================================

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER',
    full_name VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS datasets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_format VARCHAR(20) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    row_count INT DEFAULT 0,
    column_count INT DEFAULT 0,
    quality_score DOUBLE PRECISION DEFAULT 0.0,
    quality_grade VARCHAR(10) DEFAULT 'N/A',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dataset_columns (
    id BIGSERIAL PRIMARY KEY,
    dataset_id BIGINT REFERENCES datasets(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    inferred_type VARCHAR(50) NOT NULL,
    null_count INT DEFAULT 0,
    null_percentage DOUBLE PRECISION DEFAULT 0.0,
    distinct_count INT DEFAULT 0,
    is_primary_key_candidate BOOLEAN DEFAULT FALSE,
    min_value VARCHAR(100),
    max_value VARCHAR(100),
    mean_val DOUBLE PRECISION,
    median_val DOUBLE PRECISION,
    std_dev DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGSERIAL PRIMARY KEY,
    dataset_id BIGINT REFERENCES datasets(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    session_title VARCHAR(255) NOT NULL DEFAULT 'New Analysis Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    chat_session_id BIGINT REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL, -- 'USER' or 'ASSISTANT'
    query_text TEXT NOT NULL,
    explanation TEXT,
    intent VARCHAR(50),
    chart_type VARCHAR(50),
    chart_config_json TEXT,
    stats_json TEXT,
    safe_code_snippet TEXT,
    execution_time_ms DOUBLE PRECISION,
    limitations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_reports (
    id BIGSERIAL PRIMARY KEY,
    dataset_id BIGINT REFERENCES datasets(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    executive_summary TEXT,
    quality_score DOUBLE PRECISION,
    markdown_content TEXT,
    html_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cleaned_datasets (
    id BIGSERIAL PRIMARY KEY,
    original_dataset_id BIGINT REFERENCES datasets(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    row_count INT,
    column_count INT,
    quality_score_before DOUBLE PRECISION,
    quality_score_after DOUBLE PRECISION,
    recipe_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ml_models (
    id BIGSERIAL PRIMARY KEY,
    dataset_id BIGINT REFERENCES datasets(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    model_uuid VARCHAR(50) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    target_column VARCHAR(100),
    features_json TEXT,
    metrics_json TEXT,
    feature_importance_json TEXT,
    confusion_matrix_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_datasets_user ON datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(chat_session_id);
CREATE INDEX IF NOT EXISTS idx_reports_dataset ON analysis_reports(dataset_id);
CREATE INDEX IF NOT EXISTS idx_ml_models_dataset ON ml_models(dataset_id);
