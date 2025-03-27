# Backend FastAPI pour A/B Test Toolkit

Ce backend fournit les API nécessaires pour les calculs statistiques du toolkit d'A/B testing.

## Installation

1. Assurez-vous d'avoir Python 3.8+ installé
2. Installez les dépendances :
   ```
   pip install -r requirements.txt
   ```

## Démarrage

Pour démarrer le serveur en mode développement :

```bash
uvicorn main:app --reload
```

Le serveur sera accessible à l'adresse http://localhost:8000

## Endpoints API

### POST /calculate

Calcule la durée d'un test A/B et la taille d'échantillon minimale.

**Paramètres d'entrée :**

```json
{
  "visits": 1000,        // Nombre de visites quotidiennes
  "conversions": 100,    // Nombre de conversions quotidiennes
  "traffic": 50,         // Pourcentage du trafic inclus dans le test
  "variations": 2,       // Nombre de variations
  "improvement": 1,      // Amélioration attendue en pourcentage
  "confidence": 95,      // Niveau de confiance en pourcentage
  "method": "frequentist" // Méthode statistique ("frequentist" ou "bayesian")
}
```

**Réponse :**

```json
{
  "days": 14,           // Nombre de jours estimés
  "minSample": 10000    // Taille d'échantillon minimale nécessaire
}
```

## Déploiement sur Render

Pour déployer ce backend sur Render :

1. Créez un nouveau Web Service
2. Connectez votre dépôt Git
3. Sélectionnez le répertoire `backend`
4. Utilisez la commande de build : `pip install -r requirements.txt`
5. Utilisez la commande de démarrage : `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Définissez l'environnement sur Python 3 