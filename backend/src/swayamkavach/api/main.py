"""SwayamKavach Core API Server."""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from swayamkavach.api.routes.alerts import router as alerts_router
from swayamkavach.api.routes.deployment import router as deployment_router
from swayamkavach.api.routes.evaluation import router as evaluation_router
from swayamkavach.api.routes.experiments import router as experiments_router
from swayamkavach.api.routes.health import router as health_router
from swayamkavach.api.routes.ingestion import router as ingestion_router
from swayamkavach.api.routes.labels import router as labels_router
from swayamkavach.api.routes.lifecycle import router as lifecycle_router
from swayamkavach.api.routes.stream import router as stream_router
from swayamkavach.db.session import init_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("swayamkavach.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context for startup and shutdown hooks."""
    logger.info("Initializing SwayamKavach API and database schemas...")
    init_db()
    logger.info("Database initialized successfully.")

    # Validate DARI policy configuration at startup
    from swayamkavach.dari.policy_config import get_policy_config
    cfg = get_policy_config()
    logger.info("Loaded and validated DARI Policy %s (Q_min=%.2f, S_min=%d, L_min=%.2f, R_min=%d)",
                cfg.policy_version, cfg.q_min, cfg.s_min_retrain, cfg.l_min, cfg.r_min_for_a3)
    yield
    logger.info("Shutting down SwayamKavach API.")


app = FastAPI(
    title="SwayamKavach Control Plane API",
    description="Adaptive, Self-Healing IoT Intrusion Detection System API",
    version="0.1.0",
    lifespan=lifespan,
)

# Cross-Origin Resource Sharing: restricted to explicit frontend origins with credentials
raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
)
allowed_origins = [orig.strip() for orig in raw_origins.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-API-Key"],
)

# Mount routes under /api/v1
app.include_router(health_router, prefix="/api/v1")
app.include_router(ingestion_router, prefix="/api/v1")
app.include_router(alerts_router, prefix="/api/v1")
app.include_router(lifecycle_router, prefix="/api/v1")
app.include_router(labels_router, prefix="/api/v1")
app.include_router(evaluation_router, prefix="/api/v1")
app.include_router(deployment_router, prefix="/api/v1")
app.include_router(experiments_router, prefix="/api/v1")
app.include_router(stream_router, prefix="/api/v1")





@app.get("/")
def root():
    return {
        "system": "SwayamKavach",
        "description": "Self-Healing Autonomous IoT Intrusion Detection System",
        "docs_url": "/docs",
        "api_v1": "/api/v1",
    }
