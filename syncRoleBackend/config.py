from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    supabase_url: str
    supabase_service_role_key: str
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_encryption_key: str = ""
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"
    openai_api_key: str = ""
    gemini_api_key: str = ""
    groq_api_key: str = ""
    llm_provider: str = "openai"
    gemini_model: str = "gemini-2.0-flash-lite"
    openai_model: str = "gpt-4o-mini"
    groq_model: str = "llama-3.1-8b-instant"


settings = Settings()
