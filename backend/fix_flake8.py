#!/usr/bin/env python3
"""Script pour corriger automatiquement les erreurs Flake8."""

import re
from pathlib import Path


def fix_imports():
    """Retire les imports inutilisés."""
    fixes = [
        ("app/database.py", 80, "from app import models", ""),
        ("app/main-cors-fix.py", 10, "from fastapi.responses import JSONResponse", ""),
        ("app/routers/rapports.py", 13, "from fastapi import Body", ""),
        (
            "app/routers/rapports.py",
            14,
            "from fastapi.responses import StreamingResponse",
            "",
        ),
        ("app/routers/rapports.py", 16, "from typing import Optional", ""),
        ("app/schemas.py", 11, "from decimal import Decimal", ""),
        ("app/services/export_service.py", 9, "import os", ""),
        (
            "app/services/export_service.py",
            14,
            "from reportlab.lib.pagesizes import letter",
            "",
        ),
        (
            "app/services/export_service.py",
            16,
            "from reportlab.lib.units import inch",
            "",
        ),
        (
            "app/services/export_service.py",
            26,
            "from reportlab.lib.enums import TA_LEFT",
            "",
        ),
        ("tests/test_auth.py", 5, "import pytest", ""),
        ("tests/test_crud_articles.py", 5, "import pytest", ""),
        ("tests/test_crud_categories.py", 5, "import pytest", ""),
        ("tests/test_crud_fournisseurs.py", 5, "import pytest", ""),
        ("tests/test_crud_mouvements.py", 5, "import pytest", ""),
        ("tests/test_crud_tags.py", 5, "import pytest", ""),
        ("tests/test_permissions.py", 5, "import pytest", ""),
        ("tests/test_rapports.py", 5, "import pytest", ""),
        ("tests/test_rapports.py", 15, "from app.models import Categorie", ""),
    ]

    print("Correction des imports inutilisés...")
    for filepath, line_num, old_import, _ in fixes:
        path = Path(filepath)
        if path.exists():
            content = path.read_text(encoding="utf-8")
            lines = content.split("\n")
            if len(lines) >= line_num and old_import in lines[line_num - 1]:
                lines[line_num - 1] = ""  # Supprime la ligne
                path.write_text("\n".join(lines), encoding="utf-8")
                print(f"  ✓ {filepath}:{line_num}")


def fix_fstrings():
    """Corrige les f-strings sans placeholders."""
    path = Path("seed_database.py")
    if path.exists():
        content = path.read_text(encoding="utf-8")
        # Remplace f"texte" par "texte" si pas de {}
        content = re.sub(r'f"([^"]*?)"(?![^"]*\{)', r'"\1"', content)
        content = re.sub(r"f'([^']*?)'(?![^']*\{)", r"'\1'", content)
        path.write_text(content, encoding="utf-8")
        print("  ✓ seed_database.py - f-strings corrigés")


if __name__ == "__main__":
    fix_imports()
    fix_fstrings()
    print("\n✅ Corrections terminées !")
