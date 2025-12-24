from app import app, db, Bookmark
from datetime import datetime

restaurants = """TIKOUN OLAM
SPITISOU
RODSHENKO
ALMA
SCOSSA
BOZEN
ANGIE
MAISON SAUVAGE
JOYA Trattoria
Brach
Huguette
Adraba
Maison Sauvage
Digue
Train Deauville
Mirabeau
Amourette
BEEF Bar
AERO
Bozen
Black Dog
Bozen
Daroco
Maison Sauvage
Ischia
BAMBOU
ANDIA
As fallafel
Allenby
la table de Martine
Fille du boucher
Gallopin
L'ile
Crying tiger
Bozen
Jardins de presbourg
Hermes
Crying tiger
Corail resto
Le recepteur
Restaurant molitor
Brasserie auteuil
Resto barzurto
Marcello
SOMA restaurant
Brass st germain
Petit Poucet
Romeo
Grande cascade
square
waknine"""

# Nettoyer et dédupliquer la liste
restaurant_list = [r.strip() for r in restaurants.split('\n') if r.strip()]
restaurant_list = list(dict.fromkeys(restaurant_list))  # Supprimer les doublons en gardant l'ordre

with app.app_context():
    added = 0
    skipped = 0

    for resto in restaurant_list:
        # Vérifier si le restaurant existe déjà
        existing = Bookmark.query.filter_by(titre=resto, categorie='restaurant paris').first()

        if existing:
            print(f"⏭️  '{resto}' existe déjà, ignoré")
            skipped += 1
        else:
            bookmark = Bookmark(
                titre=resto,
                description='',
                labels='restaurant',
                categorie='restaurant paris',
                lien=''
            )
            db.session.add(bookmark)
            added += 1
            print(f"✅ '{resto}' ajouté")

    db.session.commit()

    print(f"\n📊 Résumé :")
    print(f"   ✅ {added} restaurants ajoutés")
    print(f"   ⏭️  {skipped} restaurants déjà présents")
    print(f"   📝 Total : {len(restaurant_list)} restaurants dans la liste")
