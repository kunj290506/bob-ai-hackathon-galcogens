"""
FastAPI Application Entry Point for D1 Mission Readiness & Predictive Maintenance Copilot.
Combines RESTful API services, defense RBAC, ML inference, and the IBM Bob FastMCP server.
"""

from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.backend.app.core.config import settings
from src.backend.app.db.base import init_db
from src.backend.app.api.routes.auth import router as auth_router
from src.backend.app.api.routes.fleet import router as fleet_router
from src.backend.app.api.routes.predictions import router as predictions_router
from src.backend.app.api.routes.maintenance import router as maintenance_router
from src.backend.app.api.routes.sensors import router as sensors_router
from src.backend.app.api.routes.copilot import router as copilot_router
from src.backend.app.mcp.server import mcp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MissionReadinessAPI")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initializes database tables on application startup."""
    logger.info("Initializing D1 Mission Readiness Copilot platform...")
    await init_db()
    logger.info("Database schema verified.")
    yield
    logger.info("Shutting down Mission Readiness Copilot platform.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Military Fleet Readiness & Condition-Based Predictive Maintenance Copilot powered by IBM Bob, watsonx.ai, and FastMCP.",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(fleet_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)
app.include_router(maintenance_router, prefix=settings.API_V1_STR)
app.include_router(sensors_router, prefix=settings.API_V1_STR)
app.include_router(copilot_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System"])
async def health_check():
    """System health check endpoint."""
    return {
        "status": "OPERATIONAL",
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "gpu_accelerated": True,
        "watsonx_mode": "LIVE" if settings.WATSONX_API_KEY else "DUAL_MODE_GRANITE_SIMULATOR"
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Welcome to D1 Mission Readiness & Predictive Maintenance Copilot API",
        "documentation": "/docs",
        "mcp_server": "/mcp",
        "api_v1": settings.API_V1_STR
    }
