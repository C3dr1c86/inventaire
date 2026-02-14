# Description

<!-- Décrivez brièvement les changements apportés -->

## Type de changement

- [ ] 🐛 Bug fix (correction non-breaking)
- [ ] ✨ Nouvelle fonctionnalité (changement non-breaking)
- [ ] 💥 Breaking change (fonctionnalité ou correction qui casse la compatibilité)
- [ ] 📝 Documentation
- [ ] 🔧 Configuration / DevOps
- [ ] ♻️ Refactoring
- [ ] 🎨 UI/UX

## Checklist

### Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests d'intégration ajoutés/mis à jour (si applicable)
- [ ] Tous les tests passent localement (`npm test`, `pytest`)
- [ ] Couverture de tests maintenue/améliorée

### Code Quality
- [ ] Code formaté (Black, ESLint)
- [ ] Pas de warnings lint
- [ ] Pas de nouveaux secrets détectés (`./deployment/security/scan-secrets.sh`)
- [ ] Variables d'environnement documentées (si nouvelles)

### Documentation
- [ ] README mis à jour (si applicable)
- [ ] Commentaires de code ajoutés pour logique complexe
- [ ] CHANGELOG.md mis à jour
- [ ] Documentation API mise à jour (Swagger/OpenAPI)

### Sécurité
- [ ] Pas de secrets hardcodés
- [ ] Inputs validés correctement
- [ ] Permissions vérifiées (si endpoints protégés)
- [ ] Dépendances à jour (pas de vulnérabilités critiques)

### Base de données (si applicable)
- [ ] Migration créée et testée
- [ ] Rollback testé
- [ ] Pas de breaking changes sur schéma existant

## Screenshots (si UI)

<!-- Ajouter captures d'écran si changements visuels -->

## Testing

<!-- Décrire comment tester ces changements -->

```bash
# Commandes pour tester
cd backend && pytest
cd frontend && npm test
```

## Notes additionnelles

<!-- Informations supplémentaires pour les reviewers -->

## Checklist Reviewer

- [ ] Code review effectué
- [ ] Tests passent dans CI
- [ ] Couverture acceptable (≥60% backend, ≥15% frontend)
- [ ] Documentation claire
- [ ] Pas de régression identifiée
