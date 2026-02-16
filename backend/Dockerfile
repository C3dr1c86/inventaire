# Multi-stage build pour optimiser la taille de l'image
FROM python:3.14-slim as base

# Variables d'environnement pour Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Créer un utilisateur non-root pour la sécurité
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Stage de build - installation des dépendances
FROM base as builder

WORKDIR /build

# Copier seulement requirements.txt pour cache Docker
COPY requirements.txt .

# Installer les dépendances dans un virtualenv
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r requirements.txt

# Stage final - image de production légère
FROM base as production

WORKDIR /app

# Copier le virtualenv depuis le builder
COPY --from=builder /opt/venv /opt/venv

# Ajouter le virtualenv au PATH
ENV PATH="/opt/venv/bin:$PATH"

# Copier le code de l'application
COPY app/ ./app/

# Créer les dossiers nécessaires avec les bonnes permissions
RUN mkdir -p database exports uploads && \
    chown -R appuser:appuser /app

# Passer à l'utilisateur non-root
USER appuser

# Exposer le port FastAPI
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health').read()" || exit 1

# Commande de démarrage
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
