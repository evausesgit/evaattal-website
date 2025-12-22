# Application de Gestion de Notes

Une application web Progressive Web App (PWA) pour gérer vos notes et liens avec des catégories et des labels.

## Fonctionnalités

- Ajouter des notes avec titre, description, catégorie, labels et lien
- Filtrer par catégorie
- Recherche par mots-clés dans tous les champs
- Interface responsive (mobile et desktop)
- Installable comme application sur téléphone (PWA)
- Base de données SQLite locale
- Aucune authentification requise

## Installation

1. Installer les dépendances Python :
```bash
pip install -r requirements.txt
```

2. Lancer l'application :
```bash
python app.py
```

3. Ouvrir votre navigateur sur : `http://localhost:5000`

## Utilisation

### Ajouter un favori
- Cliquez sur le bouton **+** en bas à droite
- Remplissez le formulaire
- Cliquez sur **Ajouter**

### Filtrer par catégorie
- Cliquez sur une catégorie dans le menu horizontal
- Cliquez sur **Tout** pour voir tous les favoris

### Rechercher
- Utilisez la barre de recherche en haut
- La recherche s'effectue dans tous les champs (titre, description, labels, catégorie)

### Installer comme application mobile

#### Sur iPhone/iPad (Safari) :
1. Ouvrir le site dans Safari
2. Appuyer sur le bouton Partager (icône carré avec flèche)
3. Sélectionner "Sur l'écran d'accueil"
4. Nommer l'application et confirmer

#### Sur Android (Chrome) :
1. Ouvrir le site dans Chrome
2. Appuyer sur le menu (3 points verticaux)
3. Sélectionner "Ajouter à l'écran d'accueil"
4. Nommer l'application et confirmer

## Structure du projet

```
evaattal-website/
├── app.py                 # Application Flask principale
├── requirements.txt       # Dépendances Python
├── bookmarks.db          # Base de données SQLite (créée automatiquement)
├── templates/
│   └── index.html        # Page HTML principale
└── static/
    ├── style.css         # Styles CSS
    ├── app.js            # JavaScript de l'application
    ├── sw.js             # Service Worker pour PWA
    └── icon-*.png        # Icônes de l'application
```

## API REST

L'application expose les endpoints suivants :

- `GET /api/bookmarks` - Récupérer tous les favoris
- `POST /api/bookmarks` - Créer un nouveau favori
- `DELETE /api/bookmarks/:id` - Supprimer un favori
- `GET /api/categories` - Récupérer toutes les catégories
- `GET /api/search?q=mot` - Rechercher des favoris

## Hébergement

Pour mettre l'application en ligne, vous pouvez utiliser :
- **Heroku** (gratuit avec limitations)
- **PythonAnywhere** (gratuit avec limitations)
- **Railway** (gratuit avec limitations)
- **Render** (gratuit avec limitations)

## Licence

Projet libre d'utilisation.
