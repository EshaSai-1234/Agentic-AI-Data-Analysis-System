import os

class Settings:
    PROJECT_NAME: str = "Agentic AI Data Analysis Service"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    
    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "local")  # local, openai, ollama, anthropic
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Security & Execution Limits
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
    SANDBOX_TIMEOUT_SECONDS: int = int(os.getenv("SANDBOX_TIMEOUT_SECONDS", "10"))
    MAX_ROWS_FOR_IN_MEMORY_PROCESSING: int = int(os.getenv("MAX_ROWS_LIMIT", "500000"))
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "./storage")

settings = Settings()
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
