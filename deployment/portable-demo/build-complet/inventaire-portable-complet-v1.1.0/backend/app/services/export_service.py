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
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import barcode
from barcode.writer import ImageWriter

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
    writer = csv.writer(output, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)

    # En-têtes
    writer.writerow([
        'ID',
        'Nom',
        'SKU',
        'Quantité',
        'Quantité Min',
        'Prix Unitaire (€)',
        'Catégorie',
        'Description',
        'Valeur Stock (€)'
    ])

    # Données
    for article in articles:
        writer.writerow([
            article.id,
            article.nom,
            article.sku or '',
            article.quantite,
            article.quantite_min,
            f"{article.prix_unitaire:.2f}",
            article.categorie.nom if article.categorie else 'Sans catégorie',
            article.description or '',
            f"{article.valeur_stock:.2f}"
        ])

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
    writer = csv.writer(output, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)

    # En-têtes
    writer.writerow([
        'ID',
        'Date',
        'Article',
        'Type',
        'Quantité',
        'Quantité Avant',
        'Quantité Après',
        'Motif'
    ])

    # Données
    for mouvement in mouvements:
        writer.writerow([
            mouvement.id,
            mouvement.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            mouvement.article.nom if mouvement.article else 'N/A',
            mouvement.type,
            mouvement.quantite,
            mouvement.quantite_avant,
            mouvement.quantite_apres,
            mouvement.motif or ''
        ])

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
    writer = csv.writer(output, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)

    # En-têtes
    writer.writerow([
        'ID',
        'Nom',
        'SKU',
        'Quantité Actuelle',
        'Quantité Minimum',
        'Écart',
        'Catégorie',
        'Prix Unitaire (€)'
    ])

    # Données
    for article in articles:
        ecart = article.quantite - article.quantite_min
        writer.writerow([
            article.id,
            article.nom,
            article.sku or '',
            article.quantite,
            article.quantite_min,
            ecart,
            article.categorie.nom if article.categorie else 'Sans catégorie',
            f"{article.prix_unitaire:.2f}"
        ])

    return output.getvalue()


def export_inventaire_pdf(articles: List[models.Article], valeur_totale: float) -> bytes:
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
        bottomMargin=30
    )

    # Container pour les éléments du PDF
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1f77b4'),
        spaceAfter=30,
        alignment=TA_CENTER
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.grey,
        spaceAfter=20,
        alignment=TA_CENTER
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
        subtitle_style
    )
    elements.append(subtitle)
    elements.append(Spacer(1, 20))

    # Tableau des articles
    if articles:
        # En-têtes du tableau
        data = [['ID', 'Nom', 'SKU', 'Qté', 'Prix (€)', 'Catégorie', 'Valeur (€)']]

        # Données
        for article in articles:
            data.append([
                str(article.id),
                article.nom[:30] + '...' if len(article.nom) > 30 else article.nom,
                article.sku or '-',
                str(article.quantite),
                f"{article.prix_unitaire:.2f}",
                (article.categorie.nom[:15] if article.categorie else 'N/A'),
                f"{article.valeur_stock:.2f}"
            ])

        # Créer le tableau
        table = Table(data, colWidths=[30, 150, 60, 40, 60, 80, 80])

        # Style du tableau
        table.setStyle(TableStyle([
            # En-tête
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f77b4')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

            # Corps du tableau
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # ID
            ('ALIGN', (3, 1), (3, -1), 'CENTER'),  # Quantité
            ('ALIGN', (4, 1), (-1, -1), 'RIGHT'),  # Prix et valeurs
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),

            # Lignes alternées
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))

        elements.append(table)
    else:
        no_data = Paragraph("Aucun article dans l'inventaire", styles['Normal'])
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
        bottomMargin=30
    )

    # Container pour les éléments du PDF
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#d62728'),  # Rouge
        spaceAfter=30,
        alignment=TA_CENTER
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.grey,
        spaceAfter=20,
        alignment=TA_CENTER
    )

    # Titre
    title = Paragraph("⚠ Alerte Stock Bas", title_style)
    elements.append(title)

    # Date et statistiques
    date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
    subtitle = Paragraph(
        f"Généré le {date_str}<br/>"
        f"Nombre d'articles en stock bas : {len(articles)}",
        subtitle_style
    )
    elements.append(subtitle)
    elements.append(Spacer(1, 20))

    # Tableau des articles
    if articles:
        # En-têtes du tableau
        data = [['ID', 'Nom', 'SKU', 'Qté Actuelle', 'Qté Min', 'Écart', 'Catégorie']]

        # Données
        for article in articles:
            ecart = article.quantite - article.quantite_min
            data.append([
                str(article.id),
                article.nom[:35] + '...' if len(article.nom) > 35 else article.nom,
                article.sku or '-',
                str(article.quantite),
                str(article.quantite_min),
                str(ecart),
                (article.categorie.nom[:20] if article.categorie else 'N/A')
            ])

        # Créer le tableau
        table = Table(data, colWidths=[30, 180, 60, 60, 60, 50, 80])

        # Style du tableau
        table.setStyle(TableStyle([
            # En-tête
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#d62728')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),

            # Corps du tableau
            ('BACKGROUND', (0, 1), (-1, -1), colors.Color(1, 0.95, 0.95)),  # Rouge clair
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('ALIGN', (0, 1), (0, -1), 'CENTER'),  # ID
            ('ALIGN', (3, 1), (5, -1), 'CENTER'),  # Quantités et écart
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),

            # Lignes alternées
            ('ROWBACKGROUNDS', (0, 1), (-1, -1),
             [colors.Color(1, 0.95, 0.95), colors.Color(1, 0.9, 0.9)])
        ]))

        elements.append(table)

        # Note en bas
        elements.append(Spacer(1, 20))
        note = Paragraph(
            "<b>Note :</b> L'écart négatif indique de combien d'unités le stock est en dessous du seuil minimum.",
            styles['Normal']
        )
        elements.append(note)
    else:
        good_news = Paragraph(
            "✓ Aucun article en stock bas. Tous les stocks sont au-dessus du seuil minimum !",
            styles['Normal']
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
        bottomMargin=20
    )

    # Container pour les éléments du PDF
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#007bff'),
        spaceAfter=15,
        alignment=TA_CENTER
    )

    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=10,
        alignment=TA_CENTER
    )

    # Titre
    title = Paragraph("Planche de Codes-Barres", title_style)
    elements.append(title)

    # Sous-titre avec date et nombre
    date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
    subtitle = Paragraph(
        f"Généré le {date_str} - {len(articles_avec_sku)} article(s)",
        subtitle_style
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
            CODE128 = barcode.get_barcode_class('code128')
            code_barre = CODE128(article.sku, writer=ImageWriter())

            # Options pour un code-barre plus petit adapté aux étiquettes
            options = {
                'module_width': 0.25,
                'module_height': 5.5,  # Réduit de 30% (était 8.0)
                'quiet_zone': 1.5,
                'font_size': 8,
                'text_distance': 4.0,  # Augmenté pour bien séparer le texte
                'write_text': True
            }

            # Générer l'image en mémoire
            barcode_buffer = BytesIO()
            code_barre.write(barcode_buffer, options=options)
            barcode_buffer.seek(0)

            # Créer l'image ReportLab (hauteur réduite de 33%)
            barcode_image = Image(barcode_buffer, width=7*cm, height=2*cm)

            # Créer le contenu de la cellule
            cell_content = [
                Paragraph(
                    f"<b>{article.nom[:40]}</b>",
                    ParagraphStyle('CellTitle', fontSize=10, alignment=TA_CENTER, spaceAfter=3)
                ),
                Paragraph(
                    f"SKU: <font color='gray'>{article.sku}</font>",
                    ParagraphStyle('CellSKU', fontSize=8, alignment=TA_CENTER, textColor=colors.grey, spaceAfter=5)
                ),
                barcode_image,
                Paragraph(
                    f"Qté: {article.quantite} | Prix: {article.prix_unitaire:.2f}€",
                    ParagraphStyle('CellInfo', fontSize=7, alignment=TA_CENTER, textColor=colors.grey, spaceBefore=3)
                )
            ]

            # Créer un mini-tableau pour centrer le contenu dans la cellule
            mini_table = Table([[item] for item in cell_content], colWidths=[cell_width])
            mini_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))

            row.append(mini_table)

            # Quand on a 2 cellules, on ajoute la ligne au tableau
            if len(row) == 2:
                table_data.append(row)
                row = []

            # Toutes les 12 étiquettes (6 lignes), on crée un tableau et on ajoute un saut de page
            if len(table_data) == 6:
                # Créer et ajouter le tableau
                main_table = Table(table_data, colWidths=[cell_width, cell_width], rowHeights=[cell_height] * 6)
                main_table.setStyle(TableStyle([
                    ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
                    ('BACKGROUND', (0, 0), (-1, -1), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 5),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                    ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                ]))

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
                ParagraphStyle('Error', fontSize=9, alignment=TA_CENTER, textColor=colors.red)
            )
            row.append(error_cell)
            if len(row) == 2:
                table_data.append(row)
                row = []

    # Ajouter les cellules restantes s'il y en a
    if row:
        # Compléter la ligne avec une cellule vide si nécessaire
        while len(row) < 2:
            row.append(Paragraph("", styles['Normal']))
        table_data.append(row)

    # Ajouter le dernier tableau s'il reste des données
    if table_data:
        main_table = Table(table_data, colWidths=[cell_width, cell_width],
                          rowHeights=[cell_height] * len(table_data))
        main_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ]))

        elements.append(main_table)

    # Note en bas
    elements.append(Spacer(1, 15))
    note = Paragraph(
        "💡 <b>Astuce :</b> Découpez le long des lignes grises pour obtenir des étiquettes individuelles.",
        ParagraphStyle('Note', fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    )
    elements.append(note)

    # Construire le PDF
    doc.build(elements)

    # Récupérer le contenu
    pdf_content = buffer.getvalue()
    buffer.close()

    return pdf_content
