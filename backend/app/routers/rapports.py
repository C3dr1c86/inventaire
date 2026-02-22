"""
Routes API pour les rapports et exports.

Endpoints:
- GET /api/rapports/statistiques - Statistiques globales
- GET /api/rapports/stock-bas - Articles en stock bas
- GET /api/rapports/valeur-totale - Valeur totale du stock
- GET /api/rapports/export/csv - Export CSV
- GET /api/rapports/export/pdf - Export PDF
- POST /api/rapports/export/barcodes-pdf - Export PDF codes-barres personnalisé
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Literal, List
from datetime import datetime
from pydantic import BaseModel

from app import crud, schemas, models
from app.database import get_db
from app.services import export_service
from app.auth import get_current_user

# Créer le router
router = APIRouter()


# Schéma pour la requête de génération de codes-barres
class BarcodesExportRequest(BaseModel):
    article_ids: List[int]


# Schéma pour la requête de génération de QR codes d'emplacements
class QRCodesExportRequest(BaseModel):
    emplacement_ids: List[int]


@router.get("/statistiques", response_model=schemas.StatistiquesResponse)
def obtenir_statistiques(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    """
    Récupère les statistiques globales de l'inventaire.

    Retourne :
    - Nombre total d'articles
    - Nombre total de catégories
    - Valeur totale du stock
    - Nombre d'articles en stock bas

    Args:
        db: Session de base de données

    Returns:
        Statistiques globales
    """
    stats = crud.get_statistiques(db)
    return schemas.StatistiquesResponse(**stats)


@router.get("/stock-bas", response_model=schemas.RapportStockBas)
def rapport_stock_bas(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    """
    Génère un rapport des articles en stock bas.

    Un article est considéré en stock bas quand :
    quantité actuelle < quantité minimum

    Args:
        db: Session de base de données

    Returns:
        Liste des articles en stock bas
    """
    articles = crud.get_articles_stock_bas(db)
    return schemas.RapportStockBas(articles=articles, total=len(articles))


@router.get("/valeur-totale", response_model=schemas.RapportValeurTotale)
def rapport_valeur_totale(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    """
    Calcule la valeur totale du stock avec détails par catégorie.

    La valeur d'un article = quantité × prix_unitaire

    Args:
        db: Session de base de données

    Returns:
        Valeur totale et détails par catégorie
    """
    valeur_info = crud.get_valeur_totale_stock(db)
    return schemas.RapportValeurTotale(**valeur_info)


@router.get("/export/csv")
def export_csv(
    type_export: Literal["articles", "mouvements", "stock-bas"] = Query(
        "articles", description="Type d'export à générer"
    ),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Exporte des données au format CSV.

    Types d'export disponibles :
    - **articles** : Liste complète des articles
    - **mouvements** : Historique des mouvements
    - **stock-bas** : Articles en stock bas uniquement

    Args:
        type_export: Type de données à exporter
        db: Session de base de données

    Returns:
        Fichier CSV téléchargeable

    Raises:
        HTTPException 400: Si le type d'export est invalide
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if type_export == "articles":
        articles, _ = crud.get_articles(db, skip=0, limit=10000)
        csv_content = export_service.export_articles_csv(articles)
        filename = f"inventaire_articles_{timestamp}.csv"

    elif type_export == "mouvements":
        mouvements, _ = crud.get_mouvements(db, skip=0, limit=10000)
        csv_content = export_service.export_mouvements_csv(mouvements)
        filename = f"inventaire_mouvements_{timestamp}.csv"

    elif type_export == "stock-bas":
        articles = crud.get_articles_stock_bas(db)
        csv_content = export_service.export_stock_bas_csv(articles)
        filename = f"inventaire_stock_bas_{timestamp}.csv"

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type d'export invalide : {type_export}",
        )

    # Retourner le CSV
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/csv; charset=utf-8",
        },
    )


@router.get("/export/pdf")
def export_pdf(
    type_export: Literal["inventaire", "stock-bas"] = Query(
        "inventaire", description="Type d'export à générer"
    ),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Exporte des données au format PDF.

    Types d'export disponibles :
    - **inventaire** : Rapport complet de l'inventaire
    - **stock-bas** : Alerte des articles en stock bas

    Args:
        type_export: Type de rapport à générer
        db: Session de base de données

    Returns:
        Fichier PDF téléchargeable

    Raises:
        HTTPException 400: Si le type d'export est invalide
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if type_export == "inventaire":
        articles, _ = crud.get_articles(db, skip=0, limit=10000)
        valeur_info = crud.get_valeur_totale_stock(db)
        pdf_content = export_service.export_inventaire_pdf(
            articles, valeur_info["valeur_totale"]
        )
        filename = f"rapport_inventaire_{timestamp}.pdf"

    elif type_export == "stock-bas":
        articles = crud.get_articles_stock_bas(db)
        pdf_content = export_service.export_stock_bas_pdf(articles)
        filename = f"alerte_stock_bas_{timestamp}.pdf"

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Type d'export invalide : {type_export}",
        )

    # Retourner le PDF
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/pdf",
        },
    )


@router.post("/export/barcodes-pdf")
def export_barcodes_pdf(
    request: BarcodesExportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Génère un PDF avec les codes-barres des articles sélectionnés.

    Le PDF est formaté en grille (2 colonnes, 4 lignes) pour faciliter
    l'impression et le découpage des étiquettes.

    Args:
        request: Liste des IDs d'articles pour lesquels générer des codes-barres
        db: Session de base de données

    Returns:
        Fichier PDF téléchargeable avec les codes-barres

    Raises:
        HTTPException 400: Si aucun article n'est sélectionné ou si aucun n'a de SKU
        HTTPException 404: Si un des articles n'existe pas
    """
    if not request.article_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Aucun article sélectionné"
        )

    # Récupérer les articles depuis la base de données
    articles = []
    for article_id in request.article_ids:
        article = crud.get_article(db, article_id)
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Article {article_id} non trouvé",
            )
        articles.append(article)

    # Générer le PDF
    try:
        pdf_content = export_service.export_barcodes_pdf(articles)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du PDF : {str(e)}",
        )

    # Nom du fichier avec timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"codes_barres_{timestamp}.pdf"

    # Retourner le PDF
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/pdf",
        },
    )


@router.post("/export/emplacements-qrcodes-pdf")
def export_emplacements_qrcodes_pdf(
    request: QRCodesExportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Génère un PDF avec les QR codes des emplacements sélectionnés.

    Le PDF est formaté en grille (2 colonnes, 3 lignes) pour faciliter
    l'impression et le découpage des étiquettes.

    Args:
        request: Liste des IDs d'emplacements pour lesquels générer des QR codes
        db: Session de base de données

    Returns:
        Fichier PDF téléchargeable avec les QR codes

    Raises:
        HTTPException 400: Si aucun emplacement n'est sélectionné
        HTTPException 404: Si un des emplacements n'existe pas
    """
    if not request.emplacement_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun emplacement sélectionné",
        )

    # Récupérer les emplacements depuis la base de données
    emplacements = []
    for emplacement_id in request.emplacement_ids:
        emplacement = crud.get_emplacement(db, emplacement_id)
        if not emplacement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Emplacement {emplacement_id} non trouvé",
            )
        emplacements.append(emplacement)

    # Générer le PDF
    try:
        pdf_content = export_service.export_emplacements_qrcodes_pdf(emplacements)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du PDF : {str(e)}",
        )

    # Nom du fichier avec timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"qrcodes_emplacements_{timestamp}.pdf"

    # Retourner le PDF
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/pdf",
        },
    )


@router.get("/export/fournisseurs-{format}")
def export_fournisseurs(
    format: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Exporte tous les fournisseurs en CSV ou PDF"""
    fournisseurs = crud.get_fournisseurs(db)

    if format == "csv":
        csv_content = export_service.export_fournisseurs_csv(fournisseurs)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=fournisseurs_{datetime.now().strftime('%Y%m%d')}.csv"
            },
        )
    elif format == "pdf":
        pdf_content = export_service.export_fournisseurs_pdf(fournisseurs)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=fournisseurs_{datetime.now().strftime('%Y%m%d')}.pdf"
            },
        )
    else:
        raise HTTPException(
            status_code=400, detail="Format non supporté (csv ou pdf uniquement)"
        )


@router.get("/export/tags-{format}")
def export_tags(
    format: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Exporte tous les tags en CSV ou PDF"""
    from sqlalchemy.orm import joinedload

    tags = db.query(models.Tag).options(joinedload(models.Tag.articles)).all()

    if format == "csv":
        csv_content = export_service.export_tags_csv(tags)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=tags_{datetime.now().strftime('%Y%m%d')}.csv"
            },
        )
    elif format == "pdf":
        pdf_content = export_service.export_tags_pdf(tags)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=tags_{datetime.now().strftime('%Y%m%d')}.pdf"
            },
        )
    else:
        raise HTTPException(
            status_code=400, detail="Format non supporté (csv ou pdf uniquement)"
        )


@router.post("/export/etiquettes-dymo")
def export_etiquettes_dymo(
    request: BarcodesExportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Exporte les articles sélectionnés au format CSV compatible DYMO Label Software.

    Le CSV contient les colonnes attendues par le template DYMO :
    - Nom : Nom complet de l'article
    - SKU : Référence article
    - Code_Barres : Valeur pour le code-barres 1D (= SKU)
    - Emplacement : Code de l'emplacement physique
    - Categorie : Catégorie (parent > enfant si hiérarchique)

    Encodage UTF-8 avec BOM pour compatibilité Excel et DYMO Connect.

    Args:
        request: Liste des IDs d'articles à exporter
        db: Session de base de données

    Returns:
        Fichier CSV téléchargeable

    Raises:
        HTTPException 400: Si aucun article sélectionné
        HTTPException 404: Si un article n'existe pas
    """
    import csv
    import io
    from sqlalchemy.orm import joinedload

    if not request.article_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Aucun article sélectionné"
        )

    # Récupérer les articles avec leurs relations
    articles = (
        db.query(models.Article)
        .options(
            joinedload(models.Article.emplacement),
            joinedload(models.Article.categorie).joinedload(models.Categorie.parent),
        )
        .filter(models.Article.id.in_(request.article_ids))
        .all()
    )

    if not articles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun article trouvé pour les IDs fournis",
        )

    # Générer le CSV en mémoire
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";", quoting=csv.QUOTE_ALL)

    # En-têtes — doivent correspondre aux variables du template DYMO
    writer.writerow(["Nom", "SKU", "Code_Barres", "Emplacement", "Categorie"])

    for article in articles:
        emplacement_code = article.emplacement.code if article.emplacement else ""

        categorie_nom = ""
        if article.categorie:
            if article.categorie.parent:
                categorie_nom = (
                    f"{article.categorie.parent.nom} > {article.categorie.nom}"
                )
            else:
                categorie_nom = article.categorie.nom

        writer.writerow(
            [
                article.nom,
                article.sku or "",
                article.sku or "",  # Code_Barres = SKU
                emplacement_code,
                categorie_nom,
            ]
        )

    # UTF-8 BOM pour compatibilité Excel et DYMO Connect
    csv_bytes = ("\ufeff" + output.getvalue()).encode("utf-8")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"etiquettes_dymo_{timestamp}.csv"

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/csv; charset=utf-8",
        },
    )


@router.post("/export/etiquettes-dymo-emplacements")
def export_etiquettes_dymo_emplacements(
    request: QRCodesExportRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Exporte les emplacements sélectionnés au format CSV compatible DYMO Label Software.

    Colonnes : Code, Description, Code_QR, Niveau, Parent
    Encodage UTF-8 avec BOM pour compatibilité Excel et DYMO Connect.
    """
    import csv
    import io
    from sqlalchemy.orm import joinedload

    if not request.emplacement_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun emplacement sélectionné",
        )

    emplacements = (
        db.query(models.Emplacement)
        .options(joinedload(models.Emplacement.parent))
        .filter(models.Emplacement.id.in_(request.emplacement_ids))
        .all()
    )

    if not emplacements:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun emplacement trouvé pour les IDs fournis",
        )

    # Format identique à "Exporter CSV" de la page Emplacements :
    # séparateur virgule, QR_Code en col 2 avec contenu "emplacement:{id}:{code}"
    output = io.StringIO()
    writer = csv.writer(output, delimiter=",", quoting=csv.QUOTE_ALL)
    writer.writerow(
        [
            "Code",
            "QR_Code",
            "Description",
            "Niveau",
            "Parent",
            "Capacité max",
            "Quantité utilisée",
            "% remplissage",
        ]
    )

    niveaux = {0: "Zone", 1: "Étagère", 2: "Boîte"}

    for emp in emplacements:
        # Format attendu par le scanner : "emplacement:{id}:{code}"
        code_qr = f"emplacement:{emp.id}:{emp.code}"
        niveau_label = (
            niveaux.get(emp.niveau, str(emp.niveau)) if hasattr(emp, "niveau") else ""
        )
        parent_code = emp.parent.code if emp.parent else ""
        capacite_max = emp.capacite_max if emp.capacite_max is not None else ""
        quantite_utilisee = (
            emp.quantite_utilisee if emp.quantite_utilisee is not None else 0
        )
        if emp.capacite_max and emp.capacite_max > 0:
            pct = f"{round(quantite_utilisee / emp.capacite_max * 100)}%"
        else:
            pct = "Illimité"

        writer.writerow(
            [
                emp.code,
                code_qr,
                emp.description or "",
                niveau_label,
                parent_code,
                capacite_max,
                quantite_utilisee,
                pct,
            ]
        )

    csv_bytes = ("\ufeff" + output.getvalue()).encode("utf-8")
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"etiquettes_dymo_emplacements_{timestamp}.csv"

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "text/csv; charset=utf-8",
        },
    )


@router.get("/export/emplacements-{format}")
def export_emplacements_data(
    format: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Exporte tous les emplacements en CSV ou PDF"""
    from sqlalchemy.orm import joinedload

    emplacements = (
        db.query(models.Emplacement)
        .options(
            joinedload(models.Emplacement.parent),
            joinedload(models.Emplacement.articles),
        )
        .all()
    )

    if format == "csv":
        csv_content = export_service.export_emplacements_csv(emplacements)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=emplacements_{datetime.now().strftime('%Y%m%d')}.csv"
            },
        )
    elif format == "pdf":
        pdf_content = export_service.export_emplacements_pdf(emplacements)
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=emplacements_{datetime.now().strftime('%Y%m%d')}.pdf"
            },
        )
    else:
        raise HTTPException(
            status_code=400, detail="Format non supporté (csv ou pdf uniquement)"
        )
