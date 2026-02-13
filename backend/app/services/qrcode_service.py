"""
Service de génération de QR codes.

Ce module fournit des fonctions pour générer des QR codes
pour les emplacements physiques de l'atelier.
"""

import qrcode
from io import BytesIO


def generate_qrcode(data: str) -> BytesIO:
    """
    Génère un QR code contenant les données fournies.

    Args:
        data: Chaîne de caractères à encoder dans le QR code

    Returns:
        BytesIO: Image PNG du QR code en mémoire

    Example:
        >>> qr_image = generate_qrcode("emplacement:1:ZONE-A1")
        >>> # qr_image peut être retourné dans une StreamingResponse
    """
    # Créer l'objet QR code
    qr = qrcode.QRCode(
        version=1,  # Version 1 (21x21 pixels) - ajusté automatiquement si besoin
        error_correction=qrcode.constants.ERROR_CORRECT_L,  # Correction d'erreur minimale
        box_size=10,  # Taille de chaque "boîte" en pixels
        border=4,  # Bordure en nombre de boîtes
    )

    # Ajouter les données
    qr.add_data(data)
    qr.make(fit=True)

    # Créer l'image
    img = qr.make_image(fill_color="black", back_color="white")

    # Sauvegarder dans un buffer en mémoire
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)  # Revenir au début du buffer

    return buffer
