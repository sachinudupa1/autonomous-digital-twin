from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = 'development'
    debug: bool = False
    firebase_project_id: str = 'autonomous-digital-twin'
    allowed_origins: str = 'http://localhost:5173'
    ml_model_path: str = 'agents/machine-learning/artifacts/ml-scheduler-v1.joblib'
    bridge_token: str = ''

    model_config = SettingsConfigDict(env_file='backend/.env', extra='ignore')

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(',') if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()