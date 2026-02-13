# 🚀 Démarrage Rapide - Mode Développement Local

Guide pour lancer l'application de gestion d'inventaire en mode développement sur votre PC.

## ⚡ Démarrage en 2 minutes

### 1️⃣ Démarrer le Backend (Terminal 1)

```bash
cd backend
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux
uvicorn app.main:app --reload
```

✅ **Backend démarré** → http://localhost:8000
📚 **Documentation API** → http://localhost:8000/docs

---

### 2️⃣ Démarrer le Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

✅ **Frontend démarré** → http://localhost:5173

---

### 3️⃣ Créer votre compte

1. Ouvrez http://localhost:5173
2. Cliquez sur "Créer un compte"
3. Remplissez le formulaire
4. Commencez à utiliser l'application !

---

## 🔧 Configuration

### Backend (.env)

Créez un fichier `.env` dans le dossier `backend/` :

```env
SECRET_KEY=votre-cle-secrete-jwt-ici
DATABASE_URL=sqlite:///database/inventaire.db
```

### Frontend (.env)

Créez un fichier `.env` dans le dossier `frontend/` :

```env
VITE_API_URL=http://localhost:8000/api
VITE_DEV_MODE=true
```

---

## 📋 Prérequis

### Installation initiale (une seule fois)

#### Backend :
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

#### Frontend :
```bash
cd frontend
npm install
```

---

## 🐛 Dépannage

### Le backend ne démarre pas

❌ **Erreur : "ModuleNotFoundError"**
```bash
# Réinstallez les dépendances
cd backend
venv\Scripts\activate
pip install -r requirements.txt
```

❌ **Erreur : "Address already in use"**
```bash
# Le port 8000 est déjà utilisé
# Utilisez un autre port :
uvicorn app.main:app --reload --port 8001
# Puis modifiez VITE_API_URL dans frontend/.env
```

---

### Le frontend ne démarre pas

❌ **Erreur : "Cannot find module"**
```bash
# Réinstallez les modules
cd frontend
rm -rf node_modules package-lock.json
npm install
```

❌ **Erreur : "Network error" dans la console**
```bash
# Vérifiez que le backend est démarré
# Vérifiez frontend/.env : VITE_API_URL doit être correct
```

---

### La base de données est vide

🗑️ **Réinitialiser la base de données :**
```bash
# Supprimez le fichier de base de données
cd backend
rm database/inventaire.db
# Relancez le backend - la DB sera recréée automatiquement
```

---

## 🎯 Fonctionnalités disponibles

- ✅ **Authentification** : Système de login JWT (mono-utilisateur)
- ✅ **Articles** : CRUD complet avec recherche et filtres
- ✅ **Catégories** : Organisation des articles
- ✅ **Tags** : Étiquetage des articles avec couleurs
- ✅ **Mouvements** : Suivi des entrées/sorties de stock
- ✅ **Dashboard** : Statistiques et alertes stock bas
- ✅ **Rapports** : Exports CSV et PDF
- ✅ **Responsive** : Fonctionne sur PC, tablette et mobile

---

## 📚 Documentation complète

- **CLAUDE.md** : Guide détaillé pour développeurs
- **docs/INSTALL.md** : Installation complète
- **docs/QUICKSTART.md** : Démarrage rapide
- **README.md** : Vue d'ensemble du projet

---

## ⚠️ Mode mono-utilisateur

**Important** : Un seul compte utilisateur peut être créé. L'endpoint `/register` refusera toute tentative de création de compte supplémentaire.

Pour créer un nouveau compte, supprimez d'abord la base de données :
```bash
rm backend/database/inventaire.db
```

---

## 🐳 Déploiement Docker

Les fichiers Docker ont été archivés dans `docker-archive/`. Pour déployer en production, consultez `docker-archive/README.md`.

---

Dernière mise à jour : 2026-02-07
