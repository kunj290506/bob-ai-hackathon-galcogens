# Multi-stage Dockerfile for D1 Mission Readiness Backend
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY src/backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Production runtime image
FROM python:3.11-slim AS runner

WORKDIR /app

# Create non-privileged defense service user
RUN useradd -m -u 1001 appuser

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY src/backend/app/ ./src/backend/app/
COPY src/data/ ./src/data/

# Ensure application directory and database storage are owned by appuser
RUN mkdir -p /app/data && chown -R appuser:appuser /app

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

USER appuser

CMD ["uvicorn", "src.backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
