from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///bookmarks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modèle de base de données
class Bookmark(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    titre = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    labels = db.Column(db.String(500))  # Labels séparés par des virgules
    categorie = db.Column(db.String(100), nullable=False)
    lien = db.Column(db.String(500))
    date_creation = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'titre': self.titre,
            'description': self.description,
            'labels': self.labels.split(',') if self.labels else [],
            'categorie': self.categorie,
            'lien': self.lien,
            'date_creation': self.date_creation.isoformat()
        }

# Créer les tables
with app.app_context():
    db.create_all()

# Routes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/bookmarks', methods=['GET'])
def get_bookmarks():
    """Récupérer tous les bookmarks"""
    bookmarks = Bookmark.query.order_by(Bookmark.date_creation.desc()).all()
    return jsonify([b.to_dict() for b in bookmarks])

@app.route('/api/bookmarks', methods=['POST'])
def create_bookmark():
    """Créer un nouveau bookmark"""
    data = request.json

    # Convertir les labels en chaîne
    labels_str = ','.join(data.get('labels', [])) if isinstance(data.get('labels'), list) else data.get('labels', '')

    bookmark = Bookmark(
        titre=data['titre'],
        description=data.get('description', ''),
        labels=labels_str,
        categorie=data['categorie'],
        lien=data.get('lien', '')
    )

    db.session.add(bookmark)
    db.session.commit()

    return jsonify(bookmark.to_dict()), 201

@app.route('/api/bookmarks/<int:bookmark_id>', methods=['DELETE'])
def delete_bookmark(bookmark_id):
    """Supprimer un bookmark"""
    bookmark = Bookmark.query.get_or_404(bookmark_id)
    db.session.delete(bookmark)
    db.session.commit()
    return '', 204

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Récupérer toutes les catégories uniques"""
    categories = db.session.query(Bookmark.categorie).distinct().all()
    return jsonify([c[0] for c in categories])

@app.route('/api/search', methods=['GET'])
def search_bookmarks():
    """Rechercher des bookmarks par mots-clés"""
    query = request.args.get('q', '')

    if not query:
        return jsonify([])

    # Recherche dans titre, description, labels et catégorie
    bookmarks = Bookmark.query.filter(
        db.or_(
            Bookmark.titre.contains(query),
            Bookmark.description.contains(query),
            Bookmark.labels.contains(query),
            Bookmark.categorie.contains(query)
        )
    ).order_by(Bookmark.date_creation.desc()).all()

    return jsonify([b.to_dict() for b in bookmarks])

@app.route('/manifest.json')
def manifest():
    """Manifest PWA"""
    return jsonify({
        "name": "Mes Favoris",
        "short_name": "Favoris",
        "description": "Application de gestion de favoris et liens",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#4CAF50",
        "icons": [
            {
                "src": "/static/icon-192.png",
                "sizes": "192x192",
                "type": "image/png"
            },
            {
                "src": "/static/icon-512.png",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
