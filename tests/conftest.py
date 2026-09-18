"""
Pytest configuration and shared fixtures for D1 Mission Readiness test suite.

Creates all database tables and seeds reference data before any test runs.
Required in CI where no pre-existing SQLite file exists.
Uses an isolated test SQLite file that never touches the production database.
"""

import asyncio
import os

# Point tests at a dedicated test DB -- must be set BEFORE any src module import
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite+aiosqlite:///./test_mission_readiness.db"
)
# Disable CUDA device driver during unit tests on Windows to avoid DLL unload stack corruption
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")



def pytest_configure(config):
    """Create all ORM tables and seed test data before any test collection begins."""
    asyncio.run(_setup_test_db())


async def _setup_test_db():
    """Create all SQLAlchemy ORM tables and seed the test SQLite database."""
    # Import AFTER env var is set so engine picks up the correct URL
    from src.backend.app.db.base import init_db
    await init_db()

    # Seed fleet data so MCP tools and integration tests have real assets to query
    try:
        from src.data.seed import seed_database
        await seed_database()
    except Exception:
        # Seed may have already run or data may already exist -- safe to ignore
        pass
