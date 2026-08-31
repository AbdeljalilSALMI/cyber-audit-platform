# Plateforme d'audit et de maturité cybersécurité pour PME

Plateforme web permettant à une PME de réaliser un audit de cybersécurité
via un questionnaire pondéré, de calculer automatiquement un score de
maturité, d'identifier les risques associés, de générer des recommandations
et un plan d'action, et de suivre son évolution dans le temps.

Le questionnaire par défaut (24 questions, 5 thèmes) reprend le guide
AUSIM/CMRPI, formalisé dans le Jalon 1 du projet.

## Architecture

Backend Django modulaire, une app par domaine métier :

```
apps/
├── accounts/        Utilisateurs, rôles (RBAC), journal d'audit (AuditLog)
├── organizations/   PME clientes
├── questionnaires/  Référentiels, catégories, questions, choix, conditions
├── audits/          Audits et réponses
├── scoring/         Moteur de scoring, niveaux de maturité
├── risks/           Risques et modèles de génération automatique
├── recommendations/ Recommandations et modèles de génération automatique
├── action_plans/    Plan d'action
├── reports/         Génération de rapports PDF
└── notifications/   Notifications in-app
```

## Technologies

- Python 3 / Django 5.2 (LTS) / Django REST Framework
- PostgreSQL 14+
- JWT (djangorestframework-simplejwt)
- reportlab (génération PDF, pur Python)
- drf-spectacular (documentation Swagger/OpenAPI)

## Installation

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Configuration

Copier `.env.example` en `.env` et renseigner :

```
DJANGO_SECRET_KEY=...
DJANGO_DEBUG=True            # False en production (active HTTPS strict)
DB_NAME=cyber_audit_db
DB_USER=...
DB_PASSWORD=...
DB_HOST=localhost
DB_PORT=5432
```

Créer la base PostgreSQL :

```sql
CREATE DATABASE cyber_audit_db;
CREATE USER cyber_audit_user WITH PASSWORD '...';
GRANT ALL PRIVILEGES ON DATABASE cyber_audit_db TO cyber_audit_user;
```

## Migrations et démarrage

```powershell
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_jalon1_questionnaire   # charge le questionnaire par défaut
python manage.py seed_maturity_levels        # charge les 5 niveaux de maturité
python manage.py runserver
```

Admin : http://127.0.0.1:8000/admin/
Documentation API (Swagger) : http://127.0.0.1:8000/api/docs/

## Rôles

| Rôle | Droits principaux |
|---|---|
| `ADMIN` | Gestion complète : utilisateurs, référentiels, questionnaires |
| `AUDITOR` | Création d'audits, validation des résultats et recommandations |
| `COMPANY_ADMIN` | Gestion de son organisation, réponses, consultation des résultats |
| `COMPANY_USER` | Réponses aux questions assignées |

Les rôles `COMPANY_*` ne voient que les données de leur propre organisation
(via `OrganizationScopedQuerysetMixin`, appliqué à toutes les API concernées).

## Cycle d'un audit

1. `POST /api/audits/` — créer un audit (organisation + référentiel)
2. `POST /api/audits/{id}/answers/` — répondre à chaque question
3. `POST /api/audits/{id}/complete/` — termine l'audit et déclenche en cascade :
   calcul du score → identification des risques → recommandations → plan d'action → notification
4. `POST /api/reports/generate/` `{"audit": id}` — génère le rapport PDF
5. `GET /api/dashboard/?organization=<id>` — tableau de bord agrégé

## Scoring

`Question Score = Answer Score × Question Weight`
`Category Score = Σ points obtenus / Σ poids des questions × 100`
`Global Score = Σ points obtenus (toutes questions) / Σ poids (toutes questions) × 100`

Les niveaux de maturité (Initial / Basique / Intermédiaire / Maîtrisé /
Optimisé) sont configurables depuis l'admin (`MaturityLevel`).

## Sécurité

- Mots de passe hashés (Django), authentification JWT
- RBAC par rôle + filtrage automatique par organisation
- Limitation de débit sur le login (5/min) contre le brute-force
- Validation des fichiers uploadés (extension + taille max 10 Mo)
- Journal d'audit (`AuditLog`) : qui, quoi, sur quelle ressource, quand, IP
- HTTPS strict, HSTS, cookies sécurisés automatiquement en production (`DEBUG=False`)
- Aucun secret dans le code : tout passe par `.env` (jamais commité, voir `.gitignore`)

## Tests

```powershell
python manage.py test apps
```

25 tests couvrant : authentification, permissions par organisation, moteur
de scoring (calculs détaillés), moteur de risques, recommandations, plan
d'action.

## Commandes de gestion utiles

| Commande | Rôle |
|---|---|
| `seed_jalon1_questionnaire` | Charge le questionnaire par défaut (24 questions) |
| `seed_maturity_levels` | Charge les 5 niveaux de maturité |
| `check_action_deadlines` | Notifie les actions en retard / proches échéance — à planifier quotidiennement |

## Note Windows / Python 3.14

Sous Windows avec Python 3.14, `manage.py` exécute automatiquement les
commandes dans un thread à pile élargie (contournement d'une limite de
récursion plus stricte sous Windows sur cette version de Python).
L'auto-reload de `runserver` est de fait désactivé : redémarrer manuellement
le serveur après une modification de code.
