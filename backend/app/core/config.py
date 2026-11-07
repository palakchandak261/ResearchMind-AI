import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "ResearchGraph AI"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "researchgraph-ai-insecure-secret-key-change-in-prod-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./researchgraph.db")
    
    # Vector DB / Search
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    USE_LOCAL_VECTOR_ENGINE: bool = True
    
    # Graph DB (Neo4j)
    NEO4J_URI: str = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    NEO4J_USER: str = os.getenv("NEO4J_USER", "neo4j")
    NEO4J_PASSWORD: str = os.getenv("NEO4J_PASSWORD", "password")
    USE_LOCAL_GRAPH_ENGINE: bool = True
    
    # OpenAlex & Academic APIs
    OPENALEX_API_URL: str = "https://api.openalex.org"
    OPENALEX_EMAIL: str = os.getenv("OPENALEX_EMAIL", "researcher@example.edu")
    SEMANTIC_SCHOLAR_API_URL: str = "https://api.semanticscholar.org/graph/v1"
    CROSSREF_API_URL: str = "https://api.crossref.org"
    ARXIV_API_URL: str = "http://export.arxiv.org/api"
    
    # EWRGS Weights (w1*U + w2*T + w3*D + w4*L + w5*C)
    EWRGS_WEIGHT_U: float = 0.25  # Underexploration
    EWRGS_WEIGHT_T: float = 0.20  # Emerging trend
    EWRGS_WEIGHT_D: float = 0.20  # Method/dataset diversity deficit
    EWRGS_WEIGHT_L: float = 0.20  # Reported limitation evidence
    EWRGS_WEIGHT_C: float = 0.15  # Unresolved/conflicting evidence
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        case_sensitive = True

settings = Settings()
