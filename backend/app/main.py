import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db, AsyncSessionLocal
from app.services.paper_service import paper_service
from app.api.endpoints import router as api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database and In-memory Knowledge Indexes
    print("[ResearchGraph AI] Initializing database and algorithmic knowledge engines...")
    await init_db()
    async with AsyncSessionLocal() as session:
        await paper_service.ensure_seeded(session)
    print("[ResearchGraph AI] Startup complete. Ready to serve research intelligence queries.")
    yield
    # Shutdown logic if needed
    print("[ResearchGraph AI] Shutting down service.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Research Discovery, Intelligence and Research Gap Identification Platform.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - Explicit whitelist
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "product": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "tagline": "Discover Connections. Understand Research. Find What's Missing.",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
