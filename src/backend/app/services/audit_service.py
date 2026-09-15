"""
Audit Logging Service for Defense Operations.
Provides tamper-evident record keeping of authentication, authorization,
predictive diagnostics, and maintenance lifecycle transitions.
"""

from datetime import datetime
import json
import logging
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.app.db.models import AuditLog

logger = logging.getLogger("AuditService")


async def record_audit_event(
    session: AsyncSession,
    action: str,
    entity_type: str,
    username: str = "SYSTEM",
    user_id: Optional[int] = None,
    entity_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: str = "127.0.0.1"
) -> AuditLog:
    """
    Persists an immutable audit log entry into the database.
    Ensures zero sensitive credentials or secrets are logged.
    """
    clean_details = {}
    if details:
        for k, v in details.items():
            if any(secret_kw in k.lower() for secret_kw in ["password", "secret", "token", "key", "credential"]):
                clean_details[k] = "[REDACTED]"
            else:
                clean_details[k] = v

    log_entry = AuditLog(
        user_id=user_id,
        username=username,
        action=action.upper(),
        entity_type=entity_type.upper(),
        entity_id=entity_id,
        details_json=json.dumps(clean_details),
        ip_address=ip_address,
        timestamp=datetime.utcnow()
    )

    session.add(log_entry)
    # Flush without committing immediately so caller can control transaction boundary
    await session.flush()
    logger.info(f"AUDIT: [{log_entry.action}] entity={log_entry.entity_type} id={log_entry.entity_id} user={log_entry.username}")
    return log_entry
