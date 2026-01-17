from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    SUPABASE_URL: str
    SUPABASE_KEY: str

    class Config:
        env_file = ".env.local"
        case_sensitive = True


# Create a singleton settings instance
settings = Settings()
