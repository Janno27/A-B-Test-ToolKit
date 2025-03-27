#!/bin/bash
# Script pour démarrer le backend FastAPI

# Installation des dépendances
pip install -r requirements.txt

# Démarrage du serveur
uvicorn main:app --host 0.0.0.0 --port 8000 --reload 