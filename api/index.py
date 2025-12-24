from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
import re
from pathlib import Path

# Get the directory containing this file (api/)
BASE_DIR = Path(__file__).resolve().parent.parent

app = Flask(__name__,
            template_folder=str(BASE_DIR / 'templates'),
            static_folder=str(BASE_DIR / 'static'))

# Use environment variable for database or default to SQLite
# Vercel Postgres uses POSTGRES_URL, but also check DATABASE_URL for compatibility
database_url = os.environ.get('POSTGRES_URL') or os.environ.get('DATABASE_URL', 'sqlite:///bookmarks.db')

# Vercel Postgres URLs start with 'postgres://' but SQLAlchemy 1.4+ requires 'postgresql://'
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql://', 1)

# Fix malformed Supabase pooler parameter if present
# Remove invalid parameter like '&supa=base-pooler.x' which should be '&pgbouncer=true' or removed
database_url = re.sub(r'&supa=base-pooler\.x', '', database_url)
database_url = re.sub(r'\?supa=base-pooler\.x&', '?', database_url)
database_url = re.sub(r'\?supa=base-pooler\.x$', '', database_url)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
}
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

# Variable pour tracker l'état de la base de données
db_initialized = False
db_error = None

# Créer les tables
try:
    with app.app_context():
        db.create_all()
        db_initialized = True
        print("Database tables created successfully")
except Exception as e:
    db_error = str(e)
    print(f"Warning: Could not create database tables: {e}")
    # Continue anyway - the error will be caught when routes are accessed

# Routes

@app.route('/health')
def health():
    """Route de diagnostic"""
    # Don't expose full database URL (contains credentials)
    db_url = os.environ.get('POSTGRES_URL', 'Not set')
    if db_url != 'Not set' and '@' in db_url:
        # Mask credentials: postgres://user:password@host/db -> postgres://***:***@host/db
        db_url_masked = re.sub(r'://[^:]+:[^@]+@', '://***:***@', db_url)
    else:
        db_url_masked = db_url

    return jsonify({
        'status': 'ok' if db_initialized else 'error',
        'database_initialized': db_initialized,
        'database_url': db_url_masked,
        'error': db_error
    })

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

@app.route('/api/bookmarks/<int:bookmark_id>', methods=['PUT'])
def update_bookmark(bookmark_id):
    """Modifier un bookmark"""
    bookmark = Bookmark.query.get_or_404(bookmark_id)
    data = request.json

    # Convertir les labels en chaîne
    labels_str = ','.join(data.get('labels', [])) if isinstance(data.get('labels'), list) else data.get('labels', '')

    bookmark.titre = data.get('titre', bookmark.titre)
    bookmark.description = data.get('description', bookmark.description)
    bookmark.labels = labels_str
    bookmark.categorie = data.get('categorie', bookmark.categorie)
    bookmark.lien = data.get('lien', bookmark.lien)

    db.session.commit()

    return jsonify(bookmark.to_dict()), 200

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
        "name": "Mes notes",
        "short_name": "Notes",
        "description": "Application de gestion de notes et liens",
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

# This is required for Vercel
app = app
