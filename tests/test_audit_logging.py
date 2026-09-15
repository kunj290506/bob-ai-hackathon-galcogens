"""
Unit & Integration Tests for Defense Audit Logging System.
Verifies tamper-evident audit log creation, event types, field integrity,
and automatic credential redaction.
"""

import json
import pytest
from sqlalchemy import select

from src.backend.app.db.base import async_session_factory
from src.backend.app.db.models import AuditLog
from src.backend.app.services.audit_service import record_audit_event


@pytest.mark.asyncio
async def test_audit_logging_redacts_credentials():
    """Confidential credentials, secrets, and passwords must be automatically redacted."""
    async with async_session_factory() as session:
        log_entry = await record_audit_event(
            session=session,
            action="USER_AUTHENTICATION",
            entity_type="AUTH",
            username="test.operator",
            details={
                "ip": "192.168.1.50",
                "password": "SuperSecretPassword123!",
                "api_key": "sk-watsonx-secret-key-12345",
                "operation": "LOGIN"
            }
        )
        await session.commit()

        details = json.loads(log_entry.details_json)
        assert details["password"] == "[REDACTED]"
        assert details["api_key"] == "[REDACTED]"
        assert details["operation"] == "LOGIN"
        assert log_entry.action == "USER_AUTHENTICATION"


@pytest.mark.asyncio
async def test_audit_logging_records_operational_lifecycle_actions():
    """Work order creation, approval, and dispatch create verifiable audit records."""
    async with async_session_factory() as session:
        actions = ["WORK_ORDER_CREATE", "WORK_ORDER_APPROVED", "WORK_ORDER_COMPLETED"]
        for act in actions:
            await record_audit_event(
                session=session,
                action=act,
                entity_type="WORK_ORDER",
                username="kunj.commander",
                user_id=1,
                entity_id=101,
                details={"status_change": act}
            )
        await session.commit()

        # Query back
        res = await session.execute(
            select(AuditLog).filter(AuditLog.entity_type == "WORK_ORDER").order_by(AuditLog.id.desc()).limit(3)
        )
        logs = res.scalars().all()
        logged_actions = [l.action for l in logs]
        for act in actions:
            assert act in logged_actions
