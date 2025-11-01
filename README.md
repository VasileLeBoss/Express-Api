# Metro API

[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![Tests Unitaires](https://img.shields.io/badge/tests-unit-green)]()
[![Tests Intégration](https://img.shields.io/badge/tests-integration-yellow)]()
[![Swagger](https://img.shields.io/badge/swagger-ui-blue)](http://localhost:8080)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)]()
[![GitLab pipeline status](https://img.shields.io/gitlab/pipeline-status/VasileLeBoss/apiexpress?branch=master&label=pipeline&logo=gitlab)](https://gitlab.com/VasileLeBoss/apiexpress/-/pipelines)
[![Security Scan (npm)](https://img.shields.io/badge/security-npm%20audit-orange?logo=npm)]()
[![Security Scan (Trivy)](https://img.shields.io/badge/security-trivy-blue?logo=trivy)]()

API pour récupérer les horaires du métro (prochain passage et dernier passage) avec PostgreSQL comme backend.

---

URL
```url
https://express-api-1-rccp.onrender.com/health/
```

Swagger
```
https://express-api-1-rccp.onrender.com/api-docs/
```

---

## 1. Installation

Clone le repo et installe les dépendances :

```bash
git clone https://github.com/VasileLeBoss/Express-Api.git
cd apiexpress
npm install
```

Crée un fichier `.env` à la racine :

```env
PORT=5000
HEADWAY_MIN=4
LAST_WINDOW_START=00:50
SERVICE_END=01:25
SERVICE_START=05:35

POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=myapp
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

---

## 2. Docker (DB + API + Swagger)

Lancer tous les services :

```bash
docker compose up -d --build
```

- API → [http://localhost:5000](http://localhost:5000)
- Swagger UI → [http://localhost:8080](http://localhost:8080)

---

## 3. Endpoints

### `/last-metro`

```http
GET /last-metro?station=Chatelet
```

Réponse exemple :

```json
{
  "station": "Chatelet",
  "lastMetro": "01:25",
  "line": "M1",
  "tz": "Europe/Paris"
}
```

**Capture attendue :**  
![Capture /last-metro](./screenshots/last-metro.png)

---

### `/next-metro`

```http
GET /next-metro?station=Chatelet
```

Réponse exemple :

```json
{
  "station": "Chatelet",
  "line": "M1",
  "nextArrival": "12:34",
  "isLast": false,
  "headwayMin": 4,
  "tz": "Europe/Paris"
}
```

**Capture attendue :**  
![Capture /next-metro](./screenshots/next-metro.png)

---

## 4. Tests

### 4.1 Unit tests

```bash
npm test
```

Sortie attendue :

```
PASS  __tests__/nextArrival.test.js
PASS  __tests__/utils/nextArrival.js
```

**Capture sortie :**  
![Unit tests](./screenshots/unit-tests.png)

---

### 4.2 Integration tests (avec DB)

Depuis Docker :

```bash
docker compose exec api npm test
```

Sortie attendue :

```
PASS  __tests__/integration.test.js
```

**Capture sortie :**  
![Integration tests](./screenshots/integration-tests.png)

> Vérifie que `/last-metro` et `/next-metro` retournent bien les données de la DB réelle.

---

## 5. OpenAPI + Swagger

- OpenAPI YAML → `./openapi/openapi.yaml`
- Swagger UI → [http://localhost:8080](http://localhost:8080)
- Validation OpenAPI : via [Swagger Editor](https://editor.swagger.io/) ou `swagger-cli validate openapi.yaml`

**Capture Swagger UI :**  
![Swagger UI](./screenshots/swagger-ui.png)

---

## 6. Scans de sécurité 

Deux niveaux de vérification sont intégrés dans la CI/CD :

| Outil        | Objectif                            | Niveau | Statut |
|---------------|-------------------------------------|--------|---------|
| **npm audit** | Analyse des dépendances Node.js     | Moyen  | ✅ |
| **Trivy**     | Scan de l’image Docker (vulnérabilités système) | Haut / Critique | ✅ |

### Lancer un scan localement

```bash

npm audit --audit-level=moderate

docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image your-image-name:latest

```

---


## 7. Déploiement Staging


### Démarrer le staging

```bash
docker compose -f docker-compose.staging.yml up -d
```


### Vérifier le statut de l'API

```bash
curl http://localhost:5000/health
```

### Réponse attendue

```json
{
  "status": "ok",
}
```


### Tester une route métier

```bash
curl "http://localhost:5000/last-metro?station=République"
```

### Réponse attendue

```json
{
  "station": "République",
  "lastMetro": "01:25",
  "line": "M3",
  "tz": "Europe/Paris"
}
```

### Consulter les logs

```bash
docker compose -f docker-compose.staging.yml logs -f api
```

---




## 8. Livrables

| #   | Branch                      | Contenu attendu                                                |
| --- | --------------------------- | -------------------------------------------------------------- |
| 04  | `feature/db-read`           | Capture d’écran `GET /last-metro` et `GET /next-metro` avec DB |
| 05  | `feature/swagger`           | OpenAPI valide + Swagger à jour                                |
| 06  | `feature/unit-tests`        | Sortie `npm test` (unitaires)                                  |
| 07  | `feature/integration-tests` | Sortie `npm test` (intégration) avec DB réelle                 |
| 08  | `feature/feature-pipeline`  | Pipeline CI/CD complet (lint, tests, sécurité, pipeline badge) |
| 09  | `feature/feature-pipeline`  | Pipeline CI/CD complet (lint, tests, sécurité, pipeline badge) |
| 10  | `feature/scans-de-sécurité` | Scan de sécurité `npm audit` + `Trivy` dans la pipeline CI/CD  |
| 11  | `feature/déploiement-staging` |  Fichier `docker-compose.staging.yml`, déploiement avec image du registry, smoke tests, logs  |


---

## 9. Notes

- Tous les horaires sont en **Europe/Paris**
- Le service est fermé entre `SERVICE_END` et `SERVICE_START`
- Les tests unitaires ne nécessitent pas de DB, les tests d’intégration utilisent la DB réelle.
