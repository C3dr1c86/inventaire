# Phase de Tests Réels - Application Inventaire

**Date de début** : 2026-02-18
**Version déployée** : v1.9.2
**URL de test** : https://inventaire-nas.tail53f399.ts.net

---

## ✅ Tests fonctionnels à effectuer

### Authentification
- [ ] Connexion avec compte existant
- [ ] Déconnexion
- [ ] Vérification de la persistance de la session (fermer/rouvrir le navigateur)
- [ ] Expiration du token JWT (après 24h)
- [ ] Gestion des erreurs (mauvais identifiants)

### Gestion des Articles
- [ ] Créer un nouvel article avec tous les champs
- [ ] Modifier un article existant
- [ ] Supprimer un article
- [ ] Recherche d'articles (par nom, catégorie)
- [ ] Filtrer par stock bas
- [ ] Pagination (tester avec >10 articles)
- [ ] Associer des tags à un article
- [ ] Upload de photos d'articles
- [ ] Générer un code-barres pour un article

### Gestion des Catégories
- [ ] Créer une catégorie racine
- [ ] Créer une sous-catégorie
- [ ] Modifier une catégorie
- [ ] Supprimer une catégorie vide
- [ ] Tenter de supprimer une catégorie avec articles (doit bloquer)
- [ ] Affichage de l'arbre hiérarchique

### Gestion des Tags
- [ ] Créer un nouveau tag
- [ ] Modifier un tag (nom, couleur)
- [ ] Supprimer un tag
- [ ] Associer/dissocier un tag d'un article

### Mouvements de Stock
- [ ] Enregistrer une ENTREE de stock
- [ ] Enregistrer une SORTIE de stock
- [ ] Vérifier que la quantité est bien mise à jour
- [ ] Tenter une SORTIE avec quantité > stock disponible (doit bloquer)
- [ ] Consulter l'historique des mouvements d'un article

### Fournisseurs
- [ ] Créer un fournisseur
- [ ] Modifier un fournisseur
- [ ] Supprimer un fournisseur
- [ ] Associer un fournisseur à un article

### Emplacements
- [ ] Créer un emplacement racine
- [ ] Créer un sous-emplacement
- [ ] Générer un QR code pour un emplacement
- [ ] Associer un article à un emplacement

### Commandes
- [ ] Créer une nouvelle commande
- [ ] Ajouter des lignes de commande
- [ ] Envoyer une commande
- [ ] Recevoir une commande (mise à jour automatique du stock)
- [ ] Annuler une commande
- [ ] Générer un PDF de commande

### Rapports et Exports
- [ ] Consulter les statistiques (Dashboard)
- [ ] Afficher la liste des articles en stock bas
- [ ] Consulter la valeur totale du stock
- [ ] Exporter la liste des articles en CSV
- [ ] Exporter l'inventaire en PDF
- [ ] Exporter les codes-barres en lot (PDF)
- [ ] Exporter les QR codes des emplacements (PDF)

### Gestion Multi-Utilisateurs (v1.6.0+)
- [ ] Créer un nouvel utilisateur (admin uniquement)
- [ ] Modifier le rôle d'un utilisateur
- [ ] Modifier les permissions personnalisées d'un utilisateur
- [ ] Désactiver un utilisateur
- [ ] Vérifier que les permissions sont bien appliquées (boutons masqués)
- [ ] Vérifier que les endpoints protégés renvoient 403 si pas de permission

### Tests de Performance
- [ ] Charger une page avec >100 articles
- [ ] Recherche sur une grande base de données
- [ ] Export CSV/PDF avec beaucoup de données
- [ ] Upload de plusieurs photos simultanément

### Tests de Compatibilité
- [ ] Navigateur Chrome/Edge (Windows)
- [ ] Navigateur Firefox (Windows)
- [ ] Navigateur Safari (Mac/iOS)
- [ ] Affichage sur mobile (responsive)
- [ ] Affichage sur tablette
- [ ] Scan de QR codes avec smartphone

---

## 🐛 Bugs rencontrés

### Template
**Bug #X** : [Titre court du bug]
**Date** : YYYY-MM-DD
**Sévérité** : Critique / Haute / Moyenne / Faible
**Description** :
[Description détaillée du problème]

**Étapes de reproduction** :
1. [Étape 1]
2. [Étape 2]
3. [Résultat observé]

**Résultat attendu** :
[Ce qui devrait se passer]

**Logs/Captures d'écran** :
[Si applicable]

**Statut** : Ouvert / En cours / Résolu / Reporté

**Solution** :
[Si résolu, décrire la solution]

---

### Bugs identifiés

*(À remplir au fur et à mesure des tests)*

---

## 🔧 Ajustements futurs / Améliorations

### UX/UI
- [ ] Améliorer les messages d'erreur (plus explicites)
- [ ] Ajouter des tooltips sur les icônes
- [ ] Améliorer le feedback visuel lors des actions longues (exports)
- [ ] Ajouter des animations de transition entre les pages
- [ ] Revoir les couleurs des badges de rôles (meilleur contraste)

### Fonctionnalités
- [ ] Ajouter un filtre par date sur les mouvements
- [ ] Permettre la modification de plusieurs articles en masse
- [ ] Ajouter une corbeille pour restaurer les articles supprimés
- [ ] Implémenter un système de notifications (stock bas, commandes en attente)
- [ ] Ajouter un historique des modifications (audit trail détaillé)
- [ ] Permettre l'import CSV d'articles en masse
- [ ] Ajouter une vue "Liste de courses" basée sur le stock bas
- [ ] Implémenter un système de réservation d'articles

### Performance
- [ ] Optimiser le chargement initial (lazy loading des images)
- [ ] Implémenter la pagination côté serveur pour les grandes listes
- [ ] Ajouter un cache Redis pour les statistiques
- [ ] Compresser les images uploadées automatiquement

### Sécurité
- [ ] Implémenter le refresh token (au lieu de 24h d'expiration)
- [ ] Ajouter une blacklist de tokens JWT (logout forcé)
- [ ] Implémenter la validation 2FA (optionnelle)
- [ ] Ajouter des rate limits sur les endpoints sensibles
- [ ] Journaliser toutes les actions sensibles (logs d'audit)

### Documentation
- [ ] Créer un guide utilisateur complet (PDF)
- [ ] Ajouter des vidéos tutorielles
- [ ] Documenter les permissions personnalisées (tableau de référence)
- [ ] Créer une FAQ pour les problèmes courants

### Infrastructure
- [ ] Mettre en place des backups automatiques de la base de données
- [ ] Implémenter un système de monitoring (Prometheus/Grafana)
- [ ] Configurer des alertes (down, erreurs 500, espace disque)
- [ ] Tester la restauration depuis un backup

---

## 📊 Métriques à surveiller

### Performance
- Temps de chargement des pages (< 2s objectif)
- Temps de réponse des API (< 500ms objectif)
- Taille des exports PDF/CSV
- Utilisation mémoire des conteneurs Docker

### Utilisation
- Nombre d'articles créés par semaine
- Nombre de mouvements de stock par jour
- Nombre de connexions par jour
- Fonctionnalités les plus utilisées

### Fiabilité
- Uptime (objectif : 99.9%)
- Nombre d'erreurs 500 par jour (objectif : 0)
- Nombre d'erreurs 404 par jour
- Taux d'échec des exports

---

## 📝 Notes de test

*(Espace libre pour vos observations durant les tests)*

### Session 1 - [Date]
-

### Session 2 - [Date]
-

---

**Instructions** :
1. Cochez les cases au fur et à mesure des tests effectués
2. Documentez tous les bugs rencontrés dans la section dédiée
3. Notez les idées d'amélioration dans "Ajustements futurs"
4. Priorisez les bugs par sévérité (Critique → à corriger immédiatement)
5. Créez des issues GitHub pour les bugs confirmés
