# Démarrage Rapide - Version Portable

Guide pour créer et utiliser la version portable de l'inventaire.

## 🚀 Création du Package Portable

### Prérequis

**Sur votre PC de développement** :
- ✅ Python 3.11+ installé
- ✅ Node.js 18+ installé
- ✅ Connexion internet (pour téléchargement Python portable)

### Étape 1 : Lancer le Build

```bash
cd C:\Users\cedri\Desktop\inventaire\deployment\portable-demo\scripts
build-portable.bat
```

Le script va automatiquement :
1. ✅ Télécharger Python portable (~30MB)
2. ✅ Copier et configurer le backend
3. ✅ Build le frontend React
4. ✅ Créer une base de données démo avec exemples
5. ✅ Assembler le package complet
6. ✅ Créer un ZIP (~60MB)

**Durée** : 5-10 minutes (selon connexion internet)

### Étape 2 : Résultat

Le package sera créé dans :
```
deployment/portable-demo/build/
├── inventaire-portable-v1.1.0/    ← Dossier complet
└── inventaire-portable-v1.1.0.zip ← Archive à distribuer
```

---

## 💻 Utilisation du Package

### Distribution

**Option A : Clé USB**
1. Extraire `inventaire-portable-v1.1.0.zip`
2. Copier le dossier sur clé USB (8GB minimum)
3. Donner la clé USB à l'utilisateur

**Option B : Partage réseau**
1. Partager `inventaire-portable-v1.1.0.zip` par email/cloud
2. L'utilisateur extrait le ZIP sur son Desktop
3. Double-clic pour lancer

### Lancement

1. **Ouvrir le dossier** `inventaire-portable-v1.1.0`
2. **Double-cliquer** sur `Lancer Inventaire.bat`
3. **Attendre** ~10 secondes (30s première fois)
4. **Le navigateur s'ouvre** automatiquement
5. **Se connecter** avec `admin` / `admin`

### Arrêt

1. **Double-cliquer** sur `Arreter Inventaire.bat`
2. **Ou fermer** la fenêtre console

---

## 📦 Contenu du Package

```
inventaire-portable-v1.1.0/
├── Lancer Inventaire.bat       ← Démarrer l'application
├── Arreter Inventaire.bat      ← Arrêter l'application
├── LISEZMOI.txt                 ← Instructions utilisateur
│
├── python/                      ← Python 3.11 embarqué (~30MB)
│   ├── python.exe
│   ├── python311.dll
│   └── ...
│
├── backend/                     ← Serveur FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── crud.py
│   │   └── ...
│   ├── run.py                   ← Script de lancement
│   ├── requirements.txt
│   ├── .env.portable
│   └── database/
│       └── inventaire.db        ← Base de données SQLite
│
├── frontend/                    ← Interface React (build)
│   └── dist/
│       ├── index.html
│       ├── assets/
│       │   ├── index-xxx.js
│       │   └── index-xxx.css
│       └── env-config.js
│
├── data/                        ← Données applicatives
│   ├── exports/                 ← Fichiers CSV/PDF exportés
│   └── uploads/                 ← Photos articles (v1.2.0)
│
└── logs/                        ← Logs pour débogage
    ├── install.log
    ├── backend.log
    └── frontend.log
```

**Taille totale** : ~90MB (ZIP : ~60MB)

---

## 🎯 Données de Démonstration

La base de données `inventaire.db` est pré-remplie avec :

### Utilisateur
- **Username** : `admin`
- **Password** : `admin`

### Catégories (5 principales + sous-catégories)
1. **Matériaux** (4 sous-catégories)
   - Bois, Métal, Plastique, Autres

2. **Consommables** (5 sous-catégories)
   - Quincaillerie, Colles & Mastics, Électricité, Plomberie, Impression 3D

3. **Outillage** (4 sous-catégories)
   - Manuel, Électrique/Pneumatique, Mesure & Traçage, Spécialisé

4. **Pièces Détachées** (4 sous-catégories)
   - Impression 3D, Électronique, Plomberie, Mécanique

5. **Projets** (6 sous-catégories)
   - Menuiserie, Électricité, Plomberie, Électronique, Impression 3D, Autres

### Articles (~50 exemples)
- Contreplaqué 3mm, Planches pin, Tasseaux
- Vis, écrous, chevilles
- Câbles électriques, dominos
- Filaments PLA/PETG
- Outils manuels et électriques
- Composants électroniques
- Et plus...

### Tags (10)
- Machine, Projet, Urgent, Consommable, Outil
- Électronique, Bois, Visserie, Peinture, Colle

### Mouvements (30)
- Entrées et sorties de stock sur 30 derniers jours
- Différents motifs (commande, projet, consommation, etc.)

---

## 🔧 Personnalisation

### Changer les Données Démo

**Modifier le script** `scripts/create-demo-db.py` :
- Ajouter/supprimer catégories
- Modifier articles d'exemple
- Changer tags

**Regénérer la DB** :
```bash
python scripts\create-demo-db.py build\inventaire-portable-v1.1.0\backend\database\inventaire.db
```

### Changer le Port

**Modifier** `backend\.env.portable` :
```env
API_PORT=9000  # Au lieu de 8000
```

**Puis modifier** `Lancer Inventaire.bat` ligne du navigateur :
```batch
start http://localhost:9000
```

### Ajouter un Logo/Icône

**Pour le navigateur** :
1. Remplacer `frontend\dist\favicon.ico`
2. Rebuild le package

**Pour le .bat (future amélioration)** :
- Créer un .exe avec icône via PyInstaller

---

## ❓ FAQ

### Q : Puis-je utiliser cette version en production ?
**R** : Non, cette version est pour démonstration/tests uniquement. Pour production, utilisez Raspberry Pi ou Docker NAS.

### Q : Les données sont-elles sauvegardées ?
**R** : Oui, tout est sauvegardé dans `backend\database\inventaire.db`. Les données persistent entre redémarrages.

### Q : Puis-je copier sur plusieurs PC ?
**R** : Oui ! Chaque copie aura sa propre base de données indépendante.

### Q : Fonctionne sur Windows 7 ?
**R** : Oui, compatible Windows 7/8/10/11 (64-bit).

### Q : Peut-on accéder depuis un autre PC ?
**R** : Non, cette version est localhost uniquement. Pour accès réseau, utilisez Docker NAS ou Raspberry Pi.

### Q : Comment réinitialiser les données démo ?
**R** :
1. Arrêter l'application
2. Supprimer `backend\database\inventaire.db`
3. Relancer (la DB sera recréée vide)
4. Ou copier une sauvegarde démo

### Q : Puis-je ajouter des photos ?
**R** : Pas dans v1.1.0. Cette fonctionnalité arrivera en v1.2.0.

---

## 🐛 Dépannage

### L'application ne démarre pas

**1. Vérifier Python**
```bash
# Dans le dossier portable
python\python.exe --version
# Doit afficher : Python 3.11.x
```

**2. Consulter les logs**
```
logs\install.log   ← Erreurs installation dépendances
logs\backend.log   ← Erreurs backend
logs\frontend.log  ← Erreurs frontend
```

**3. Ports déjà utilisés**
```bash
# Vérifier port 8000
netstat -ano | findstr :8000

# Si utilisé, tuer le processus
taskkill /F /PID <PID>
```

### Erreur "Python introuvable"

**Cause** : Dossier `python/` manquant ou incomplet

**Solution** :
1. Retélécharger Python portable
2. Extraire dans `python/`
3. Relancer

### Erreur "ModuleNotFoundError"

**Cause** : Dépendances non installées

**Solution** :
1. Supprimer `backend\venv\`
2. Relancer `Lancer Inventaire.bat`
3. Les dépendances seront réinstallées

### Le navigateur ne s'ouvre pas

**Solution** :
1. Ouvrir manuellement : http://localhost:5173
2. Vérifier que le serveur frontend est lancé (logs)

---

## 📊 Performances

| Métrique | Valeur |
|----------|--------|
| **Démarrage** | ~10 secondes |
| **RAM utilisée** | ~150-200 MB |
| **Espace disque** | ~90 MB |
| **Taille ZIP** | ~60 MB |
| **Articles max** | ~10 000 (recommandé) |

---

## ✅ Checklist Distribution

Avant de distribuer le package :

- [ ] Tester sur PC vierge (sans Python/Node installés)
- [ ] Vérifier que la DB démo est créée
- [ ] Tester connexion avec admin/admin
- [ ] Vérifier toutes les pages (Dashboard, Articles, Catégories, Mouvements)
- [ ] Tester création/modification/suppression
- [ ] Vérifier exports CSV/PDF
- [ ] Lire LISEZMOI.txt pour vérifier les instructions
- [ ] Tester arrêt avec "Arreter Inventaire.bat"

---

## 🎓 Formation Utilisateur

### Scénario de Démonstration (10 minutes)

**1. Lancement** (1 min)
- Double-clic sur `Lancer Inventaire.bat`
- Connexion avec admin/admin

**2. Tour d'horizon** (2 min)
- Dashboard : Statistiques, recherche globale
- Navigation dans le menu

**3. Créer un article** (3 min)
- Aller sur Articles
- Cliquer "Nouvel article"
- Remplir : nom, SKU, quantité, catégorie
- Sauvegarder

**4. Mouvement de stock** (2 min)
- Aller sur Mouvements
- Créer mouvement SORTIE
- Vérifier mise à jour quantité

**5. Rapports** (2 min)
- Consulter stock bas
- Export CSV

---

## 📝 Notes

- Version actuelle : **v1.1.0**
- Dernière mise à jour : Février 2026
- Prochaine version : **v1.2.0** (photos articles)

---

**Retour** : [README.md](README.md)
