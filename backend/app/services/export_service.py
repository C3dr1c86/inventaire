"""
Service d'export pour générer des fichiers CSV et PDF.

Ce module fournit les fonctions pour exporter les données de l'inventaire
dans différents formats.
"""

import csv
import os
from io import StringIO, BytesIO
from typing import List
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
    Image,
    PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import barcode
from barcode.writer import ImageWriter
import qrcode

from app import models


def export_articles_csv(articles: List[models.Article]) -> str:
    """
    Génère un fichier CSV contenant la liste des articles.

    Args:
        articles: Liste des articles à exporter

    Returns:
        Contenu du fichier CSV sous forme de chaîne

    Format CSV:
        ID, Nom, SKU, Quantité, Quantité Min, Prix Unitaire, Catégorie, Valeur Stock
    """
    output = StringIO()
    writer = csv.writer(output, delimiter=",", quotechar='"', quoting=csv.QUOTE_MINIMAL)

    # En-têtes
    writer.writerow(
        [
            "ID",
            "Nom",
            "SKU",
            "Quantité",
            "Quantité Min",
            "Prix Unitaire (€)",
            "Catégorie",
            "Description",
            "Valeur Stock (€)",
        ]
    )

    # Données
    for article in articles:
        writer.writerow(
            [
                article.id,
                article.nom,
                article.sku or "",
                article.quantite,
                article.quantite_min,
                f"{article.prix_unitaire:.2f}",
                article.categorie.nom if article.categorie else "Sans catégorie",
                article.description or "",
                f"{article.valeur_stock:.2f}",
            ]
        )

    return output.getvalue()


def export_mouvements_csv(mouvements: List[models.Mouvement]) -> str:
    """
    Génère un fichier CSV contenant l'historique des mouvements.

    Args:
        mouvements: Liste des mouvements à exporter

    Returns:
        Contenu du fichier CSV sous forme de chaîne

    Format CSV:
        ID, Date, Article, Type, Quantité, Quantité Avant, Quantité Après, Motif
    """
    output = StringIO()
    writer = csv.writer(output, delimiter=",", quotechar='"', quoting=csv.QUOTE_MINIMAL)

    # En-têtes
    writer.writerow(
        [
            "ID",
            "Date",
            "Article",
            "Type",
            "Quantité",
            "Quantité Avant",
            "Quantité Après",
            "Motif",
        ]
    )

    # Données
    for mouvement in mouvements:
        writer.writerow(
            [
                mouvement.id,
                mouvement.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                mouvement.article.nom if mouvement.article else "N/A",
                mouvement.type,
                mouvement.quantite,
                mouvement.quantite_avant,
                mouvement.quantite_apres,
                mouvement.motif or "",
            ]
        )

    return output.getvalue()


def export_stock_bas_csv(articles: List[models.Article]) -> str:
    """
    Génère un fichier CSV pour les articles en stock bas.

    Args:
        articles: Liste des articles en stock bas

    Returns:
        Contenu du fichier CSV sous forme de chaîne
    """
    output = StringIO()
    writer = csv.writer(output, delimiter=",", quotechar='"', quoting=csv.QUOTE_MINIMAL)

    # En-têtes
    writer.writerow(
        [
            "ID",
            "Nom",
            "SKU",
            "Quantité Actuelle",
            "Quantité Minimum",
            "Écart",
            "Catégorie",
            "Prix Unitaire (€)",
        ]
    )

    # Données
    for article in articles:
        ecart = article.quantite - article.quantite_min
        writer.writerow(
            [
                article.id,
                article.nom,
                article.sku or "",
                article.quantite,
                article.quantite_min,
                ecart,
                article.categorie.nom if article.categorie else "Sans catégorie",
                f"{article.prix_unitaire:.2f}",
            ]
        )

    return output.getvalue()


def export_inventaire_pdf(
    articles: List[models.Article], valeur_totale: float
) -> bytes:
    """
    Génère un fichier PDF de l'inventaire complet.

    Args:
        articles: Liste des articles
        valeur_totale: Valeur totale du stock

    Returns:
        Contenu du fichier PDF sous forme de bytes
    """
    buffer = BytesIO()

    # Créer le document PDF
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )

    # Container pour les éléments du PDF
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#1f77b4"),
        spaceAfter=30,
        alignment=TA_CENTER,
    )

    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontSize=12,
        textColor=colors.grey,
        spaceAfter=20,
        alignment=TA_CENTER,
    )

    # Titre
    title = Paragraph("Rapport d'Inventaire", title_style)
    elements.append(title)

    # Date et statistiques
    date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
    subtitle = Paragraph(
        f"Généré le {date_str}<br/>"
        f"Nombre total d'articles : {len(articles)}<br/>"
        f"Valeur totale du stock : {valeur_totale:.2f} €",
        subtitle_style,
    )
    elements.append(subtitle)
    elements.append(Spacer(1, 20))

    # Tableau des articles
    if articles:
        # En-têtes du tableau
        data = [["ID", "Nom", "SKU", "Qté", "Prix (€)", "Catégorie", "Valeur (€)"]]

        # Données
        for article in articles:
            data.append(
                [
                    str(article.id),
                    article.nom[:30] + "..." if len(article.nom) > 30 else article.nom,
                    article.sku or "-",
                    str(article.quantite),
                    f"{article.prix_unitaire:.2f}",
                    (article.categorie.nom[:15] if article.categorie else "N/A"),
                    f"{article.valeur_stock:.2f}",
                ]
            )

        # Créer le tableau
        table = Table(data, colWidths=[30, 150, 60, 40, 60, 80, 80])

        # Style du tableau
        table.setStyle(
            TableStyle(
                [
                    # En-tête
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1f77b4")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    # Corps du tableau
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("TEXTCOLOR", (0, 1), (-1, -1), colors.black),
                    ("ALIGN", (0, 1), (0, -1), "CENTER"),  # ID
                    ("ALIGN", (3, 1), (3, -1), "CENTER"),  # Quantité
                    ("ALIGN", (4, 1), (-1, -1), "RIGHT"),  # Prix et valeurs
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    # Lignes alternées
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.white, colors.lightgrey],
                    ),
                ]
            )
        )

        elements.append(table)
    else:
        no_data = Paragraph("Aucun article dans l'inventaire", styles["Normal"])
        elements.append(no_data)

    # Construire le PDF
    doc.build(elements)

    # Récupérer le contenu
    pdf_content = buffer.getvalue()
    buffer.close()

    return pdf_content


def export_stock_bas_pdf(articles: List[models.Article]) -> bytes:
    """
    Génère un fichier PDF pour les articles en stock bas.

    Args:
        articles: Liste des articles en stock bas

    Returns:
        Contenu du fichier PDF sous forme de bytes
    """
    buffer = BytesIO()

    # Créer le document PDF
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )

    # Container pour les éléments du PDF
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#d62728"),  # Rouge
        spaceAfter=30,
        alignment=TA_CENTER,
    )

    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontSize=12,
        textColor=colors.grey,
        spaceAfter=20,
        alignment=TA_CENTER,
    )

    # Titre
    title = Paragraph("⚠ Alerte Stock Bas", title_style)
    elements.append(title)

    # Date et statistiques
    date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
    subtitle = Paragraph(
        f"Généré le {date_str}<br/>"
        f"Nombre d'articles en stock bas : {len(articles)}",
        subtitle_style,
    )
    elements.append(subtitle)
    elements.append(Spacer(1, 20))

    # Tableau des articles
    if articles:
        # En-têtes du tableau
        data = [["ID", "Nom", "SKU", "Qté Actuelle", "Qté Min", "Écart", "Catégorie"]]

        # Données
        for article in articles:
            ecart = article.quantite - article.quantite_min
            data.append(
                [
                    str(article.id),
                    article.nom[:35] + "..." if len(article.nom) > 35 else article.nom,
                    article.sku or "-",
                    str(article.quantite),
                    str(article.quantite_min),
                    str(ecart),
                    (article.categorie.nom[:20] if article.categorie else "N/A"),
                ]
            )

        # Créer le tableau
        table = Table(data, colWidths=[30, 180, 60, 60, 60, 50, 80])

        # Style du tableau
        table.setStyle(
            TableStyle(
                [
                    # En-tête
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#d62728")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    # Corps du tableau
                    (
                        "BACKGROUND",
                        (0, 1),
                        (-1, -1),
                        colors.Color(1, 0.95, 0.95),
                    ),  # Rouge clair
                    ("TEXTCOLOR", (0, 1), (-1, -1), colors.black),
                    ("ALIGN", (0, 1), (0, -1), "CENTER"),  # ID
                    ("ALIGN", (3, 1), (5, -1), "CENTER"),  # Quantités et écart
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    # Lignes alternées
                    (
                        "ROWBACKGROUNDS",
                        (0, 1),
                        (-1, -1),
                        [colors.Color(1, 0.95, 0.95), colors.Color(1, 0.9, 0.9)],
                    ),
                ]
            )
        )

        elements.append(table)

        # Note en bas
        elements.append(Spacer(1, 20))
        note = Paragraph(
            "<b>Note :</b> L'écart négatif indique de combien d'unités le stock est en dessous du seuil minimum.",
            styles["Normal"],
        )
        elements.append(note)
    else:
        good_news = Paragraph(
            "✓ Aucun article en stock bas. Tous les stocks sont au-dessus du seuil minimum !",
            styles["Normal"],
        )
        elements.append(good_news)

    # Construire le PDF
    doc.build(elements)

    # Récupérer le contenu
    pdf_content = buffer.getvalue()
    buffer.close()

    return pdf_content


def export_barcodes_pdf(articles: List[models.Article]) -> bytes:
    """
    Génère un fichier PDF contenant les codes-barres des articles sélectionnés.

    Le PDF est formaté en grille (2 colonnes) pour faciliter l'impression
    et le découpage des étiquettes.

    Args:
        articles: Liste des articles pour lesquels générer des codes-barres

    Returns:
        Contenu du fichier PDF sous forme de bytes

    Raises:
        ValueError: Si aucun article n'a de SKU
    """
    # Filtrer les articles qui ont un SKU
    articles_avec_sku = [a for a in articles if a.sku]

    if not articles_avec_sku:
        raise ValueError("Aucun article sélectionné n'a de SKU")

    buffer = BytesIO()

    # Créer le document PDF avec marges réduites pour maximiser l'espace
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20,
        leftMargin=20,
        topMargin=20,
        bottomMargin=20,
    )

    # Container pour les éléments du PDF
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#007bff"),
        spaceAfter=15,
        alignment=TA_CENTER,
    )

    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=10,
        alignment=TA_CENTER,
    )

    # Titre
    title = Paragraph("Planche de Codes-Barres", title_style)
    elements.append(title)

    # Sous-titre avec date et nombre
    date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
    subtitle = Paragraph(
        f"Généré le {date_str} - {len(articles_avec_sku)} article(s)", subtitle_style
    )
    elements.append(subtitle)
    elements.append(Spacer(1, 15))

    # Créer une grille 2x6 pour chaque page (12 étiquettes par page)
    # Dimensions des cellules (environ 8.5cm x 4cm pour avoir 2x6 par page A4)
    cell_width = 8.5 * cm
    cell_height = 4 * cm

    # Créer les données du tableau par groupes de 12 (2x6)
    table_data = []
    row = []

    for idx, article in enumerate(articles_avec_sku):
        # Générer le code-barre pour cet article
        try:
            CODE128 = barcode.get_barcode_class("code128")
            code_barre = CODE128(article.sku, writer=ImageWriter())

            # Options pour un code-barre plus petit adapté aux étiquettes
            options = {
                "module_width": 0.25,
                "module_height": 5.5,  # Réduit de 30% (était 8.0)
                "quiet_zone": 1.5,
                "font_size": 8,
                "text_distance": 4.0,  # Augmenté pour bien séparer le texte
                "write_text": True,
            }

            # Générer l'image en mémoire
            barcode_buffer = BytesIO()
            code_barre.write(barcode_buffer, options=options)
            barcode_buffer.seek(0)

            # Créer l'image ReportLab (hauteur réduite de 33%)
            barcode_image = Image(barcode_buffer, width=7 * cm, height=2 * cm)

            # Créer le contenu de la cellule
            cell_content = [
                Paragraph(
                    f"<b>{article.nom[:40]}</b>",
                    ParagraphStyle(
                        "CellTitle", fontSize=10, alignment=TA_CENTER, spaceAfter=3
                    ),
                ),
                Paragraph(
                    f"SKU: <font color='gray'>{article.sku}</font>",
                    ParagraphStyle(
                        "CellSKU",
                        fontSize=8,
                        alignment=TA_CENTER,
                        textColor=colors.grey,
                        spaceAfter=5,
                    ),
                ),
                barcode_image,
                Paragraph(
                    f"Qté: {article.quantite} | Prix: {article.prix_unitaire:.2f}€",
                    ParagraphStyle(
                        "CellInfo",
                        fontSize=7,
                        alignment=TA_CENTER,
                        textColor=colors.grey,
                        spaceBefore=3,
                    ),
                ),
            ]

            # Créer un mini-tableau pour centrer le contenu dans la cellule
            mini_table = Table(
                [[item] for item in cell_content], colWidths=[cell_width]
            )
            mini_table.setStyle(
                TableStyle(
                    [
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ]
                )
            )

            row.append(mini_table)

            # Quand on a 2 cellules, on ajoute la ligne au tableau
            if len(row) == 2:
                table_data.append(row)
                row = []

            # Toutes les 12 étiquettes (6 lignes), on crée un tableau et on ajoute un saut de page
            if len(table_data) == 6:
                # Créer et ajouter le tableau
                main_table = Table(
                    table_data,
                    colWidths=[cell_width, cell_width],
                    rowHeights=[cell_height] * 6,
                )
                main_table.setStyle(
                    TableStyle(
                        [
                            ("GRID", (0, 0), (-1, -1), 1, colors.lightgrey),
                            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 5),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                            ("TOPPADDING", (0, 0), (-1, -1), 5),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                        ]
                    )
                )

                elements.append(main_table)

                # Saut de page si ce n'est pas le dernier groupe
                if idx < len(articles_avec_sku) - 1:
                    elements.append(PageBreak())

                # Réinitialiser
                table_data = []

        except Exception as e:
            # En cas d'erreur sur un code-barre, ajouter une cellule d'erreur
            error_cell = Paragraph(
                f"<b>{article.nom}</b><br/>Erreur code-barre: {str(e)}",
                ParagraphStyle(
                    "Error", fontSize=9, alignment=TA_CENTER, textColor=colors.red
                ),
            )
            row.append(error_cell)
            if len(row) == 2:
                table_data.append(row)
                row = []

    # Ajouter les cellules restantes s'il y en a
    if row:
        # Compléter la ligne avec une cellule vide si nécessaire
        while len(row) < 2:
            row.append(Paragraph("", styles["Normal"]))
        table_data.append(row)

    # Ajouter le dernier tableau s'il reste des données
    if table_data:
        main_table = Table(
            table_data,
            colWidths=[cell_width, cell_width],
            rowHeights=[cell_height] * len(table_data),
        )
        main_table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 1, colors.lightgrey),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )

        elements.append(main_table)

    # Note en bas
    elements.append(Spacer(1, 15))
    note = Paragraph(
        "💡 <b>Astuce :</b> Découpez le long des lignes grises pour obtenir des étiquettes individuelles.",
        ParagraphStyle("Note", fontSize=8, textColor=colors.grey, alignment=TA_CENTER),
    )
    elements.append(note)

    # Construire le PDF
    doc.build(elements)

    # Récupérer le contenu
    pdf_content = buffer.getvalue()
    buffer.close()

    return pdf_content


def export_emplacements_qrcodes_pdf(emplacements: List[models.Emplacement]) -> bytes:
    """
    Génère un fichier PDF contenant les QR codes des emplacements sélectionnés.

    Le PDF est formaté en grille (2 colonnes x 3 lignes) pour faciliter l'impression
    et le découpage des étiquettes.

    Args:
        emplacements: Liste des emplacements pour lesquels générer des QR codes

    Returns:
        Contenu du fichier PDF sous forme de bytes
    """
    buffer = BytesIO()

    # Créer le document PDF avec marges réduites pour maximiser l'espace
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20,
        leftMargin=20,
        topMargin=20,
        bottomMargin=20,
    )

    # Container pour les éléments du PDF
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#28a745"),
        spaceAfter=15,
        alignment=TA_CENTER,
    )

    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=10,
        alignment=TA_CENTER,
    )

    # Titre
    title = Paragraph("Planche de QR Codes - Emplacements", title_style)
    elements.append(title)

    # Sous-titre avec date et nombre
    date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
    subtitle = Paragraph(
        f"Généré le {date_str} - {len(emplacements)} emplacement(s)", subtitle_style
    )
    elements.append(subtitle)
    elements.append(Spacer(1, 15))

    # Créer une grille 2x3 pour chaque page (6 étiquettes par page)
    # Dimensions des cellules (environ 8.5cm x 8cm pour avoir 2x3 par page A4)
    cell_width = 8.5 * cm
    cell_height = 8 * cm

    # Créer les données du tableau par groupes de 6 (2x3)
    table_data = []
    row = []

    for idx, emplacement in enumerate(emplacements):
        # Générer le QR code pour cet emplacement
        try:
            # Données du QR code : format "emplacement:ID:CODE"
            qr_data = f"emplacement:{emplacement.id}:{emplacement.code}"

            # Créer le QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(qr_data)
            qr.make(fit=True)

            # Générer l'image
            qr_img = qr.make_image(fill_color="black", back_color="white")

            # Convertir en BytesIO pour ReportLab
            qr_buffer = BytesIO()
            qr_img.save(qr_buffer, format="PNG")
            qr_buffer.seek(0)

            # Créer l'image ReportLab (5cm x 5cm pour le QR code)
            qr_image = Image(qr_buffer, width=5 * cm, height=5 * cm)

            # Déterminer l'icône selon le niveau
            if emplacement.niveau == 0:
                icone = "🏢"
            elif emplacement.niveau == 1:
                icone = "📚"
            else:
                icone = "📦"

            # Créer le contenu de la cellule
            cell_content = [
                Paragraph(
                    f"{icone} <b>{emplacement.code}</b>",
                    ParagraphStyle(
                        "CellCode",
                        fontSize=12,
                        alignment=TA_CENTER,
                        spaceAfter=3,
                        textColor=colors.HexColor("#28a745"),
                    ),
                )
            ]

            # Ajouter le parent seulement si l'emplacement en a un
            if emplacement.parent:
                parent_text = (
                    emplacement.parent.code_complet
                    if hasattr(emplacement.parent, "code_complet")
                    else emplacement.parent.code
                )
                cell_content.append(
                    Paragraph(
                        parent_text,
                        ParagraphStyle(
                            "CellParent",
                            fontSize=8,
                            alignment=TA_CENTER,
                            spaceAfter=8,
                            textColor=colors.grey,
                        ),
                    )
                )

            # Ajouter le QR code et la description
            cell_content.extend(
                [
                    qr_image,
                    Paragraph(
                        f"{emplacement.description[:40] + '...' if emplacement.description and len(emplacement.description) > 40 else (emplacement.description or '')}",
                        ParagraphStyle(
                            "CellDesc",
                            fontSize=7,
                            alignment=TA_CENTER,
                            textColor=colors.grey,
                            spaceBefore=5,
                        ),
                    ),
                ]
            )

            # Créer un mini-tableau pour centrer le contenu dans la cellule
            mini_table = Table(
                [[item] for item in cell_content], colWidths=[cell_width]
            )
            mini_table.setStyle(
                TableStyle(
                    [
                        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ]
                )
            )

            row.append(mini_table)

            # Quand on a 2 cellules, on ajoute la ligne au tableau
            if len(row) == 2:
                table_data.append(row)
                row = []

            # Toutes les 6 étiquettes (3 lignes), on crée un tableau et on ajoute un saut de page
            if len(table_data) == 3:
                # Créer et ajouter le tableau
                main_table = Table(
                    table_data,
                    colWidths=[cell_width, cell_width],
                    rowHeights=[cell_height] * 3,
                )
                main_table.setStyle(
                    TableStyle(
                        [
                            ("GRID", (0, 0), (-1, -1), 1, colors.lightgrey),
                            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 5),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                            ("TOPPADDING", (0, 0), (-1, -1), 5),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                        ]
                    )
                )

                elements.append(main_table)

                # Saut de page si ce n'est pas le dernier groupe
                if idx < len(emplacements) - 1:
                    elements.append(PageBreak())

                # Réinitialiser
                table_data = []

        except Exception as e:
            # En cas d'erreur sur un QR code, ajouter une cellule d'erreur
            error_cell = Paragraph(
                f"<b>{emplacement.code}</b><br/>Erreur QR code: {str(e)}",
                ParagraphStyle(
                    "Error", fontSize=9, alignment=TA_CENTER, textColor=colors.red
                ),
            )
            row.append(error_cell)
            if len(row) == 2:
                table_data.append(row)
                row = []

    # Ajouter les cellules restantes s'il y en a
    if row:
        # Compléter la ligne avec une cellule vide si nécessaire
        while len(row) < 2:
            row.append(Paragraph("", styles["Normal"]))
        table_data.append(row)

    # Ajouter le dernier tableau s'il reste des données
    if table_data:
        main_table = Table(
            table_data,
            colWidths=[cell_width, cell_width],
            rowHeights=[cell_height] * len(table_data),
        )
        main_table.setStyle(
            TableStyle(
                [
                    ("GRID", (0, 0), (-1, -1), 1, colors.lightgrey),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )

        elements.append(main_table)

    # Note en bas
    elements.append(Spacer(1, 15))
    note = Paragraph(
        "💡 <b>Astuce :</b> Scannez les QR codes pour accéder rapidement aux emplacements.",
        ParagraphStyle("Note", fontSize=8, textColor=colors.grey, alignment=TA_CENTER),
    )
    elements.append(note)

    # Construire le PDF
    doc.build(elements)

    # Récupérer le contenu
    pdf_content = buffer.getvalue()
    buffer.close()

    return pdf_content


def export_fournisseurs_csv(fournisseurs: List[models.Fournisseur]) -> str:
    """Génère un fichier CSV contenant la liste des fournisseurs."""
    output = StringIO()
    writer = csv.writer(output, delimiter=";")

    writer.writerow(
        [
            "ID",
            "Nom",
            "Contact",
            "Email",
            "Téléphone",
            "Adresse",
            "Notes",
            "Date de création",
        ]
    )

    for fournisseur in fournisseurs:
        writer.writerow(
            [
                fournisseur.id,
                fournisseur.nom,
                fournisseur.contact or "",
                fournisseur.email or "",
                fournisseur.telephone or "",
                fournisseur.adresse or "",
                fournisseur.notes or "",
                (
                    fournisseur.created_at.strftime("%d/%m/%Y %H:%M")
                    if fournisseur.created_at
                    else ""
                ),
            ]
        )

    return output.getvalue()


def export_fournisseurs_pdf(fournisseurs: List[models.Fournisseur]) -> bytes:
    """Génère un fichier PDF contenant la liste des fournisseurs."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#6f42c1"),
        spaceAfter=20,
    )

    date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
    elements.append(Paragraph(f"Liste des Fournisseurs - {date_str}", title_style))
    elements.append(Spacer(1, 12))

    data = [["Nom", "Contact", "Email", "Téléphone"]]
    for f in fournisseurs:
        data.append(
            [
                Paragraph(f.nom, styles["Normal"]),
                Paragraph(f.contact or "-", styles["Normal"]),
                Paragraph(f.email or "-", styles["Normal"]),
                Paragraph(f.telephone or "-", styles["Normal"]),
            ]
        )

    table = Table(data, colWidths=[4.5 * cm, 4 * cm, 5 * cm, 3.5 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6f42c1")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
            ]
        )
    )

    elements.append(table)
    elements.append(Spacer(1, 20))
    elements.append(
        Paragraph(f"Total : {len(fournisseurs)} fournisseur(s)", styles["Normal"])
    )

    doc.build(elements)
    return buffer.getvalue()


def export_tags_csv(tags: List[models.Tag]) -> str:
    """Génère un fichier CSV contenant la liste des tags."""
    output = StringIO()
    writer = csv.writer(output, delimiter=";")

    writer.writerow(
        ["ID", "Nom", "Couleur", "Description", "Nombre d'articles", "Date de création"]
    )

    for tag in tags:
        writer.writerow(
            [
                tag.id,
                tag.nom,
                tag.couleur or "",
                tag.description or "",
                len(tag.articles) if hasattr(tag, "articles") else 0,
                tag.created_at.strftime("%d/%m/%Y %H:%M") if tag.created_at else "",
            ]
        )

    return output.getvalue()


def export_tags_pdf(tags: List[models.Tag]) -> bytes:
    """Génère un fichier PDF contenant la liste des tags."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#fd7e14"),
        spaceAfter=20,
    )

    date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
    elements.append(Paragraph(f"Liste des Tags - {date_str}", title_style))
    elements.append(Spacer(1, 12))

    data = [["Nom", "Couleur", "Description", "Articles"]]
    for tag in tags:
        desc = tag.description or "-"
        if len(desc) > 50:
            desc = desc[:50] + "..."
        data.append(
            [
                Paragraph(tag.nom, styles["Normal"]),
                Paragraph(tag.couleur or "-", styles["Normal"]),
                Paragraph(desc, styles["Normal"]),
                str(len(tag.articles)) if hasattr(tag, "articles") else "0",
            ]
        )

    table = Table(data, colWidths=[4 * cm, 3 * cm, 7 * cm, 2 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fd7e14")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
            ]
        )
    )

    elements.append(table)
    elements.append(Spacer(1, 20))
    elements.append(Paragraph(f"Total : {len(tags)} tag(s)", styles["Normal"]))

    doc.build(elements)
    return buffer.getvalue()


def export_emplacements_csv(emplacements: List[models.Emplacement]) -> str:
    """Génère un fichier CSV contenant la liste des emplacements."""
    output = StringIO()
    writer = csv.writer(output, delimiter=";")

    writer.writerow(
        [
            "ID",
            "Code",
            "Code complet",
            "Description",
            "Niveau",
            "Parent",
            "Capacité max",
            "Quantité utilisée",
            "% Remplissage",
            "Nombre d'articles",
            "Date de création",
        ]
    )

    for e in emplacements:
        writer.writerow(
            [
                e.id,
                e.code,
                e.code_complet if hasattr(e, "code_complet") else e.code,
                e.description or "",
                e.niveau if hasattr(e, "niveau") else "",
                e.parent.code if e.parent else "",
                e.capacite_max if e.capacite_max else "Illimité",
                e.quantite_utilisee if hasattr(e, "quantite_utilisee") else 0,
                (
                    f"{e.pourcentage_remplissage:.1f}%"
                    if hasattr(e, "pourcentage_remplissage") and e.capacite_max
                    else "N/A"
                ),
                len(e.articles) if hasattr(e, "articles") else 0,
                e.created_at.strftime("%d/%m/%Y %H:%M") if e.created_at else "",
            ]
        )

    return output.getvalue()


def export_emplacements_pdf(emplacements: List[models.Emplacement]) -> bytes:
    """Génère un fichier PDF contenant la liste des emplacements."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#17a2b8"),
        spaceAfter=20,
    )

    date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
    elements.append(Paragraph(f"Liste des Emplacements - {date_str}", title_style))
    elements.append(Spacer(1, 12))

    data = [["Code", "Description", "Capacité", "Utilisé", "Articles"]]
    for e in emplacements:
        capacite_text = str(e.capacite_max) if e.capacite_max else "Illimité"
        utilise_text = (
            str(e.quantite_utilisee) if hasattr(e, "quantite_utilisee") else "0"
        )
        if e.capacite_max and hasattr(e, "pourcentage_remplissage"):
            utilise_text += f" ({e.pourcentage_remplissage:.0f}%)"

        desc = e.description or "-"
        if len(desc) > 40:
            desc = desc[:40] + "..."

        data.append(
            [
                Paragraph(
                    e.code_complet if hasattr(e, "code_complet") else e.code,
                    styles["Normal"],
                ),
                Paragraph(desc, styles["Normal"]),
                capacite_text,
                utilise_text,
                str(len(e.articles)) if hasattr(e, "articles") else "0",
            ]
        )

    table = Table(data, colWidths=[5 * cm, 6 * cm, 2.5 * cm, 2.5 * cm, 1.5 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17a2b8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("ALIGN", (2, 1), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 12),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
            ]
        )
    )

    elements.append(table)
    elements.append(Spacer(1, 20))
    elements.append(
        Paragraph(f"Total : {len(emplacements)} emplacement(s)", styles["Normal"])
    )

    doc.build(elements)
    return buffer.getvalue()


def export_commande_pdf(commande) -> bytes:
    """
    Génère un PDF pour un bon de commande fournisseur.

    Args:
        commande: Objet Commande avec fournisseur et lignes

    Returns:
        Contenu du PDF en bytes
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import (
        SimpleDocTemplate,
        Table,
        TableStyle,
        Paragraph,
        Spacer,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT
    from reportlab.lib.units import cm
    from io import BytesIO
    from datetime import datetime

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=colors.HexColor("#17a2b8"),
        alignment=TA_CENTER,
        spaceAfter=30,
    )
    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#17a2b8"),
        spaceAfter=12,
    )
    right_align_style = ParagraphStyle(
        "RightAlign", parent=styles["Normal"], alignment=TA_RIGHT
    )

    elements = []

    # En-tête
    elements.append(Paragraph("BON DE COMMANDE", title_style))
    elements.append(Spacer(1, 10))

    # Informations commande
    info_data = [
        ["Numéro de commande:", commande.numero_commande],
        ["Statut:", commande.statut],
        [
            "Date de commande:",
            (
                commande.date_commande.strftime("%d/%m/%Y %H:%M")
                if commande.date_commande
                else "Non envoyée"
            ),
        ],
        [
            "Date de réception prévue:",
            (
                commande.date_reception_prevue.strftime("%d/%m/%Y")
                if commande.date_reception_prevue
                else "Non spécifiée"
            ),
        ],
    ]

    if commande.date_reception_reelle:
        info_data.append(
            [
                "Date de réception réelle:",
                commande.date_reception_reelle.strftime("%d/%m/%Y %H:%M"),
            ]
        )

    info_table = Table(info_data, colWidths=[5 * cm, 10 * cm])
    info_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#17a2b8")),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    elements.append(info_table)
    elements.append(Spacer(1, 20))

    # Informations fournisseur
    elements.append(Paragraph("Fournisseur", heading_style))

    fournisseur_data = [
        ["Nom:", commande.fournisseur.nom],
    ]

    if commande.fournisseur.contact:
        fournisseur_data.append(["Contact:", commande.fournisseur.contact])
    if commande.fournisseur.email:
        fournisseur_data.append(["Email:", commande.fournisseur.email])
    if commande.fournisseur.telephone:
        fournisseur_data.append(["Téléphone:", commande.fournisseur.telephone])
    if commande.fournisseur.adresse:
        fournisseur_data.append(["Adresse:", commande.fournisseur.adresse])

    fournisseur_table = Table(fournisseur_data, colWidths=[5 * cm, 10 * cm])
    fournisseur_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    elements.append(fournisseur_table)
    elements.append(Spacer(1, 20))

    # Tableau des lignes de commande
    elements.append(Paragraph("Articles commandés", heading_style))

    lignes_data = [
        ["Article", "Quantité commandée", "Quantité reçue", "Prix unitaire", "Montant"]
    ]

    for ligne in commande.lignes:
        montant_ligne = ligne.quantite_commandee * float(ligne.prix_unitaire)
        lignes_data.append(
            [
                ligne.article.nom,
                str(ligne.quantite_commandee),
                str(ligne.quantite_recue),
                f"{float(ligne.prix_unitaire):.2f} €",
                f"{montant_ligne:.2f} €",
            ]
        )

    lignes_table = Table(
        lignes_data, colWidths=[7 * cm, 3 * cm, 2.5 * cm, 2.5 * cm, 2.5 * cm]
    )
    lignes_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#17a2b8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 11),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 1, colors.grey),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#f8f9fa")],
                ),
            ]
        )
    )

    elements.append(lignes_table)
    elements.append(Spacer(1, 20))

    # Montant total
    total_data = [
        ["", "", "", "Montant total:", f"{float(commande.montant_total):.2f} €"]
    ]

    total_table = Table(
        total_data, colWidths=[7 * cm, 3 * cm, 2.5 * cm, 2.5 * cm, 2.5 * cm]
    )
    total_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (3, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (3, 0), (-1, 0), 12),
                ("ALIGN", (3, 0), (-1, 0), "CENTER"),
                ("TEXTCOLOR", (3, 0), (-1, 0), colors.HexColor("#17a2b8")),
                ("LINEABOVE", (3, 0), (-1, 0), 2, colors.HexColor("#17a2b8")),
                ("BOTTOMPADDING", (3, 0), (-1, 0), 8),
            ]
        )
    )

    elements.append(total_table)

    # Notes (si présentes)
    if commande.notes:
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Notes", heading_style))
        elements.append(Paragraph(commande.notes, styles["Normal"]))

    # Pied de page
    elements.append(Spacer(1, 30))
    elements.append(
        Paragraph(
            f"Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}",
            right_align_style,
        )
    )

    doc.build(elements)
    return buffer.getvalue()
