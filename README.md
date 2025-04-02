# A/B Test Toolkit

## Structure du projet

Ce projet est composé de deux parties principales:

1. **Frontend**: Application Next.js dans le répertoire principal
2. **Backend**: API FastAPI Python dans le répertoire `/backend`

## Installation

### Backend

```bash
cd backend
pip install -r requirements.txt
```

### Frontend

```bash
npm install
```

## Exécution du projet

### Backend

```bash
cd backend
sh start.sh
```

ou

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
npm run dev
```

## Architecture de l'application

### Flux de données

1. L'utilisateur télécharge des données depuis le frontend
2. Les données sont envoyées au backend via les routes API Next.js
3. Le backend Python effectue les calculs statistiques
4. Les résultats sont renvoyés au frontend pour affichage

### Points d'API principaux

- `/api/analyze-data`: Analyse des données téléchargées
- `/api/analysis-results`: Récupération des résultats d'analyse

## Environnement

Créez un fichier `.env.local` avec:

```
BACKEND_URL=http://localhost:8000
``` 