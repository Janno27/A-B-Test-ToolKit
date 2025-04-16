#!/bin/bash

# Ce script initialise la base de données RICE en exécutant
# les scripts SQL dans le bon ordre.

# Vérifier que les variables d'environnement Supabase sont définies
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "Les variables d'environnement SUPABASE_URL et SUPABASE_ANON_KEY doivent être définies."
  echo "Ex: export SUPABASE_URL=https://your-project-id.supabase.co"
  echo "    export SUPABASE_ANON_KEY=your-anon-key"
  exit 1
fi

# Emplacement des scripts SQL
SCRIPT_DIR="$(dirname "$0")"
RESET_SCRIPT="$SCRIPT_DIR/reset_db.sql"
SESSIONS_SCRIPT="$SCRIPT_DIR/sessions_tables.sql"

echo "=== Initialisation de la base de données RICE ==="
echo "URL Supabase: $SUPABASE_URL"

# Vérifier que les scripts existent
if [ ! -f "$RESET_SCRIPT" ]; then
  echo "Le script de réinitialisation $RESET_SCRIPT n'existe pas."
  exit 1
fi

if [ ! -f "$SESSIONS_SCRIPT" ]; then
  echo "Le script des sessions $SESSIONS_SCRIPT n'existe pas."
  exit 1
fi

# Confirmation de l'utilisateur
echo "ATTENTION: Ceci va réinitialiser entièrement votre base de données RICE."
echo "Toutes les données existantes seront perdues."
read -p "Êtes-vous sûr de vouloir continuer? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Opération annulée."
  exit 1
fi

# Fonction pour exécuter un script SQL via l'API REST de Supabase
execute_sql() {
  local script_file=$1
  local script_name=$(basename "$script_file")
  
  echo "Exécution de $script_name..."
  
  # Lire le contenu du script SQL
  local sql_content=$(cat "$script_file")
  
  # Exécuter le script via curl et l'API REST de Supabase
  curl -X POST \
    "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"$sql_content\"}" \
    --silent
  
  # Vérifier le statut de la commande
  if [ $? -eq 0 ]; then
    echo "✅ $script_name exécuté avec succès."
  else
    echo "❌ Erreur lors de l'exécution de $script_name."
    exit 1
  fi
}

# Exécuter les scripts SQL dans l'ordre
echo "1. Réinitialisation de la base de données..."
execute_sql "$RESET_SCRIPT"

echo "2. Création des tables de sessions..."
execute_sql "$SESSIONS_SCRIPT"

echo "=== Initialisation terminée avec succès ==="
echo "La base de données RICE est prête à être utilisée." 