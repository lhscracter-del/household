from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "https://household-rhdc.onrender.com",
    ]
    APP_ENV: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
