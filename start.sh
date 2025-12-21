#!/bin/bash

echo "🚀 Démarrage de l'application Mes Favoris..."
echo ""

# Vérifier si pip est installé
if ! command -v pip &> /dev/null; then
    echo "❌ pip n'est pas installé. Veuillez installer Python et pip."
    exit 1
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
pip install -r requirements.txt

echo ""
echo "✅ Dépendances installées !"
echo ""
echo "🌐 Lancement du serveur..."
echo "👉 Ouvrez votre navigateur sur : http://localhost:5000"
echo ""
echo "Pour arrêter le serveur, appuyez sur Ctrl+C"
echo ""

# Lancer l'application
python app.py
