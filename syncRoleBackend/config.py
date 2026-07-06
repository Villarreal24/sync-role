import os
from typing import Any

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_URL_FIELDS = ("supabase_url", "frontend_url", "backend_url")
_REQUIRED_IN_PROD = ("frontend_url", "backend_url", "supabase_url", "supabase_service_role_key")


def _is_production() -> bool:
    return bool(os.environ.get("PORT"))


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env" if not _is_production() else None,
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

    @field_validator(*_URL_FIELDS, mode="before")
    @classmethod
    def _strip_trailing_slash(cls, v: Any) -> Any:
        if isinstance(v, str) and v.endswith("/"):
            return v.rstrip("/")
        return v

    @model_validator(mode="after")
    def _enforce_prod_env_vars(self) -> "Settings":
        if not _is_production():
            return self
        missing = [k.upper() for k in _REQUIRED_IN_PROD if k.upper() not in os.environ]
        if missing:
            raise RuntimeError(
                "Missing required env vars in production: "
                + ", ".join(missing)
                + ". Set them in Railway and redeploy."
            )
        if "localhost" in self.frontend_url or "localhost" in self.backend_url:
            raise RuntimeError(
                "FRONTEND_URL or BACKEND_URL resolved to localhost in production. "
                "Check the values set in Railway (no quotes, no extra spaces, no localhost)."
            )
        return self


settings = Settings()
