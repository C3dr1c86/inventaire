# Structure Google Form - Tests Application Inventaire

**Instructions** : Copiez-collez ce contenu dans Google Forms (https://forms.google.com)

---

## Configuration du formulaire

**Titre du formulaire** : Tests Application Inventaire - Phase Réelle

**Description** :
```
Formulaire de test pour l'application Inventaire (v1.9.2)

URL de test : https://inventaire-nas.tail53f399.ts.net

Ce formulaire permet de reporter les résultats des tests fonctionnels, les bugs rencontrés et vos suggestions d'amélioration.

Merci de remplir ce formulaire après chaque session de test !
```

**Paramètres recommandés** :
- ☑ Collecter les adresses e-mail (pour suivre qui a testé quoi)
- ☑ Autoriser la modification des réponses après envoi
- ☑ Afficher la barre de progression
- ☑ Mélanger l'ordre des questions : NON

---

## SECTION 1 : Informations générales

### Question 1 : Nom du testeur
- **Type** : Réponse courte
- **Obligatoire** : Oui

### Question 2 : Date du test
- **Type** : Date
- **Obligatoire** : Oui

### Question 3 : Durée de la session de test
- **Type** : Choix multiple
- **Options** :
  - Moins de 15 minutes
  - 15-30 minutes
  - 30 minutes - 1 heure
  - 1-2 heures
  - Plus de 2 heures

### Question 4 : Appareil utilisé
- **Type** : Cases à cocher (plusieurs réponses possibles)
- **Options** :
  - PC Windows
  - PC Mac
  - PC Linux
  - Tablette Android
  - Tablette iOS
  - Smartphone Android
  - Smartphone iOS

### Question 5 : Navigateur utilisé
- **Type** : Cases à cocher
- **Options** :
  - Google Chrome
  - Microsoft Edge
  - Mozilla Firefox
  - Safari
  - Autre

---

## SECTION 2 : Tests fonctionnels effectués

**Description de section** :
```
Cochez tous les tests que vous avez effectués durant cette session.
Marquez "Réussi ✅" si le test fonctionne correctement, "Échoué ❌" si vous avez rencontré un problème.
```

### Authentification

#### Q6 : Connexion avec compte existant
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé
- **Si "Échoué"** → Afficher la question : "Décrivez le problème rencontré" (Paragraphe)

#### Q7 : Déconnexion
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q8 : Persistance de la session (fermer/rouvrir navigateur)
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

### Gestion des Articles

#### Q9 : Créer un nouvel article
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé
- **Si "Échoué"** → Afficher : "Décrivez le problème" (Paragraphe)

#### Q10 : Modifier un article existant
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q11 : Supprimer un article
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q12 : Rechercher des articles (par nom)
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q13 : Filtrer par catégorie
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q14 : Filtrer par stock bas
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q15 : Pagination (tester avec >10 articles)
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q16 : Associer des tags à un article
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q17 : Générer un code-barres
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

### Gestion des Catégories

#### Q18 : Créer une catégorie racine
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q19 : Créer une sous-catégorie
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q20 : Modifier une catégorie
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q21 : Supprimer une catégorie vide
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q22 : Tentative de suppression d'une catégorie avec articles (doit bloquer)
- **Type** : Choix multiple
- **Options** : ✅ Réussi (bloqué comme attendu) | ❌ Échoué (suppression autorisée à tort) | ⏭️ Non testé

### Gestion des Tags

#### Q23 : Créer un nouveau tag
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q24 : Modifier un tag (nom, couleur)
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q25 : Supprimer un tag
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

### Mouvements de Stock

#### Q26 : Enregistrer une ENTRÉE de stock
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q27 : Enregistrer une SORTIE de stock
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q28 : Vérification mise à jour automatique de la quantité
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q29 : Tentative SORTIE avec quantité > stock (doit bloquer)
- **Type** : Choix multiple
- **Options** : ✅ Réussi (bloqué) | ❌ Échoué (autorisé) | ⏭️ Non testé

#### Q30 : Consulter l'historique des mouvements
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

### Fournisseurs & Emplacements

#### Q31 : Créer un fournisseur
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q32 : Créer un emplacement
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q33 : Générer un QR code d'emplacement
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

### Rapports et Exports

#### Q34 : Consulter les statistiques (Dashboard)
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q35 : Afficher la liste des articles en stock bas
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q36 : Exporter la liste des articles en CSV
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

#### Q37 : Exporter l'inventaire en PDF
- **Type** : Choix multiple
- **Options** : ✅ Réussi | ❌ Échoué | ⏭️ Non testé

---

## SECTION 3 : Bugs rencontrés

### Q38 : Avez-vous rencontré des bugs durant cette session ?
- **Type** : Choix multiple
- **Options** : Oui | Non
- **Si "Oui"** → Afficher les questions suivantes

### Q39 : Décrivez le(s) bug(s) rencontré(s)
- **Type** : Paragraphe
- **Obligatoire** : Si Q38 = Oui
- **Description** :
```
Décrivez chaque bug en détail :
- Qu'est-ce que vous faisiez ?
- Qu'est-ce qui s'est passé ?
- Qu'est-ce que vous attendiez ?

Exemple :
"J'ai essayé de créer un article avec un prix négatif. Le formulaire a été soumis sans erreur, mais l'article a été créé avec un prix de 0€ au lieu de bloquer la création."
```

### Q40 : Sévérité du bug principal
- **Type** : Choix multiple
- **Obligatoire** : Si Q38 = Oui
- **Options** :
  - 🔴 Critique (l'application plante ou perte de données)
  - 🟠 Haute (fonctionnalité importante inutilisable)
  - 🟡 Moyenne (problème gênant mais contournable)
  - 🟢 Faible (problème cosmétique ou mineur)

### Q41 : Captures d'écran du bug (si disponibles)
- **Type** : Importation de fichiers
- **Formats acceptés** : Images (PNG, JPG), Vidéo (MP4)
- **Taille max** : 10 MB par fichier

---

## SECTION 4 : Évaluation de l'expérience utilisateur

### Q42 : L'interface est-elle intuitive et facile à utiliser ?
- **Type** : Échelle linéaire (1 à 5)
- **1** = Très difficile à utiliser
- **5** = Très facile et intuitive

### Q43 : Les temps de chargement sont-ils satisfaisants ?
- **Type** : Échelle linéaire (1 à 5)
- **1** = Très lent, frustrant
- **5** = Très rapide, excellent

### Q44 : Le design est-il agréable visuellement ?
- **Type** : Échelle linéaire (1 à 5)
- **1** = Design daté ou peu agréable
- **5** = Design moderne et professionnel

### Q45 : L'application fonctionne-t-elle bien sur votre appareil ?
- **Type** : Échelle linéaire (1 à 5)
- **1** = Nombreux problèmes d'affichage
- **5** = Parfait, aucun problème

### Q46 : Note globale de l'application
- **Type** : Échelle linéaire (1 à 5)
- **1** = Très insatisfait
- **5** = Très satisfait

---

## SECTION 5 : Suggestions d'amélioration

### Q47 : Fonctionnalités manquantes ou à améliorer
- **Type** : Paragraphe
- **Description** :
```
Quelles fonctionnalités aimeriez-vous voir ajoutées ?
Quelles fonctionnalités existantes pourraient être améliorées ?

Exemples :
- "Ajouter un bouton d'export Excel en plus du CSV"
- "Permettre de trier les articles par prix"
- "Améliorer la recherche pour chercher dans les descriptions"
```

### Q48 : Améliorations UX/UI souhaitées
- **Type** : Paragraphe
- **Description** :
```
Que pourrait-on améliorer dans l'interface ou l'expérience utilisateur ?

Exemples :
- "Les boutons sont trop petits sur mobile"
- "Ajouter une confirmation avant de supprimer un article"
- "Les couleurs des tags sont difficiles à distinguer"
```

### Q49 : Autres commentaires ou remarques
- **Type** : Paragraphe
- **Facultatif**

---

## SECTION 6 : Informations techniques (Pour le débogage)

### Q50 : Avez-vous rencontré des messages d'erreur ?
- **Type** : Choix multiple
- **Options** : Oui | Non
- **Si "Oui"** → Afficher : "Copiez-collez les messages d'erreur" (Paragraphe)

### Q51 : L'application a-t-elle planté ou gelé ?
- **Type** : Choix multiple
- **Options** : Oui | Non
- **Si "Oui"** → Afficher : "Décrivez ce qui s'est passé juste avant le plantage" (Paragraphe)

---

## Message de confirmation

**Après soumission du formulaire, afficher** :
```
✅ Merci pour votre retour !

Vos réponses ont été enregistrées et aideront à améliorer l'application Inventaire.

Si vous avez reporté un bug critique, vous serez contacté rapidement pour plus de détails.

Vous pouvez modifier vos réponses à tout moment en revenant sur ce formulaire.

🔗 URL de test : https://inventaire-nas.tail53f399.ts.net
📊 Voir les résultats : [Lien vers Google Sheets]
```

---

## Instructions de création

1. **Aller sur** : https://forms.google.com
2. **Cliquer** : "+ Créer un formulaire vierge"
3. **Copier-coller** le titre et la description ci-dessus
4. **Ajouter les sections et questions** dans l'ordre (utilisez le bouton "Ajouter une section")
5. **Configurer les paramètres** :
   - Onglet "Paramètres" → Activer "Collecter les adresses e-mail"
   - Activer "Limiter à 1 réponse" si vous voulez éviter les doublons
6. **Tester le formulaire** avec le bouton "Aperçu" 👁️
7. **Partager** : Cliquer sur "Envoyer" → Copier le lien

---

## Exploitation des résultats

Les réponses seront automatiquement collectées dans **Google Sheets**.

**Créer des graphiques automatiques** :
1. Ouvrir le Google Sheets des réponses
2. Onglet "Réponses" → Cliquer sur l'icône des 3 points verticaux
3. "Obtenir un résumé des réponses"
4. Google Forms génère automatiquement des graphiques pour chaque question

**Filtrer les bugs critiques** :
1. Dans Google Sheets, utiliser un filtre sur la colonne "Sévérité du bug"
2. Filtrer uniquement "🔴 Critique" et "🟠 Haute"

**Exporter les résultats** :
- Fichier → Télécharger → CSV ou Excel

---

**Temps de création estimé** : 30-45 minutes pour créer le formulaire complet
**Temps de remplissage estimé** : 15-30 minutes par session de test
