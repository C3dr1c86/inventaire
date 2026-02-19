---
name: release
description: Crée une nouvelle version du projet inventaire (bump version + commit + tag + push)
disable-model-invocation: true
allowed-tools: Bash(git *), Read, Edit
---

# Release une nouvelle version

Effectue une release complète pour la version `$ARGUMENTS`.

## Étapes

### 1. Vérifier que le dépôt est propre
Exécute `git status` et confirme qu'il n'y a pas de fichiers non commités (hors `.claude/`).
Si des fichiers sont modifiés, stoppe et demande à l'utilisateur de commiter d'abord.

### 2. Mettre à jour la version dans les fichiers

**`frontend/src/components/layout/Layout.jsx`** :
- Remplacer l'ancienne version dans `<p>vX.X.X</p>` par `<p>$ARGUMENTS</p>`

**`CLAUDE.md`** :
- Remplacer la ligne `**Version actuelle** : vX.X.X (...)` par :
  `**Version actuelle** : $ARGUMENTS`
- Conserver le reste de la description entre parenthèses si pertinent, sinon laisser juste la version

**`docs/ROADMAP.md`** :
- Remplacer `**Version actuelle** : vX.X.X` par `**Version actuelle** : $ARGUMENTS`
- Remplacer `**Dernière mise à jour** : AAAA-MM-JJ` par la date du jour

### 3. Commit des changements
```
git add frontend/src/components/layout/Layout.jsx CLAUDE.md docs/ROADMAP.md
git commit -m "chore: Release $ARGUMENTS"
```

### 4. Créer et pousser le tag
```
git tag $ARGUMENTS
git push origin main
git push origin $ARGUMENTS
```

### 5. Confirmer
Affiche un résumé :
- Version releasée : `$ARGUMENTS`
- Tag créé et poussé
- GitHub Actions va builder et publier les images Docker automatiquement
- Lien : https://github.com/C3dr1c86/inventaire/actions
