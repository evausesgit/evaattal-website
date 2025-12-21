// État de l'application
let allBookmarks = [];
let currentCategory = 'all';

// Éléments du DOM
const addBtn = document.getElementById('addBtn');
const addModal = document.getElementById('addModal');
const addForm = document.getElementById('addForm');
const cancelBtn = document.getElementById('cancelBtn');
const closeBtn = document.querySelector('.close');
const bookmarksList = document.getElementById('bookmarksList');
const searchInput = document.getElementById('searchInput');
const categoryButtons = document.getElementById('categoryButtons');
const emptyState = document.getElementById('emptyState');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadBookmarks();
    loadCategories();
    setupEventListeners();
    registerServiceWorker();
});

// Event Listeners
function setupEventListeners() {
    addBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    addForm.addEventListener('submit', handleSubmit);
    searchInput.addEventListener('input', handleSearch);

    // Fermer le modal en cliquant à l'extérieur
    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) closeModal();
    });

    // Bouton "Tout"
    document.querySelector('[data-category="all"]').addEventListener('click', () => {
        filterByCategory('all');
    });
}

// Ouvrir/Fermer le modal
function openModal() {
    addModal.classList.add('active');
    document.getElementById('titre').focus();
}

function closeModal() {
    addModal.classList.remove('active');
    addForm.reset();
}

// Charger tous les bookmarks
async function loadBookmarks() {
    try {
        const response = await fetch('/api/bookmarks');
        allBookmarks = await response.json();
        displayBookmarks(allBookmarks);
    } catch (error) {
        console.error('Erreur lors du chargement des bookmarks:', error);
        showError('Impossible de charger les favoris');
    }
}

// Charger les catégories
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();

        const categoriesList = document.getElementById('categoriesList');
        categoryButtons.innerHTML = '';

        categories.forEach(category => {
            // Ajouter au datalist
            const option = document.createElement('option');
            option.value = category;
            categoriesList.appendChild(option);

            // Ajouter au menu
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.textContent = category;
            btn.dataset.category = category;
            btn.addEventListener('click', () => filterByCategory(category));
            categoryButtons.appendChild(btn);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
    }
}

// Afficher les bookmarks
function displayBookmarks(bookmarks) {
    if (bookmarks.length === 0) {
        bookmarksList.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    bookmarksList.innerHTML = bookmarks.map(bookmark => createBookmarkCard(bookmark)).join('');

    // Ajouter les event listeners pour les boutons de suppression
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteBookmark(btn.dataset.id));
    });
}

// Créer une carte de bookmark
function createBookmarkCard(bookmark) {
    const date = new Date(bookmark.date_creation).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const labelsHTML = bookmark.labels && bookmark.labels.length > 0
        ? `<div class="bookmark-labels">
            ${bookmark.labels.map(label => `<span class="label-tag">${label.trim()}</span>`).join('')}
           </div>`
        : '';

    const linkHTML = bookmark.lien
        ? `<a href="${bookmark.lien}" target="_blank" class="bookmark-link">🔗 ${bookmark.lien}</a>`
        : '';

    const descriptionHTML = bookmark.description
        ? `<p class="bookmark-description">${bookmark.description}</p>`
        : '';

    return `
        <div class="bookmark-card">
            <div class="bookmark-header">
                <h3 class="bookmark-title">${bookmark.titre}</h3>
                <button class="delete-btn" data-id="${bookmark.id}" title="Supprimer">×</button>
            </div>
            ${descriptionHTML}
            <span class="bookmark-category">${bookmark.categorie}</span>
            ${labelsHTML}
            ${linkHTML}
            <div class="bookmark-date">Ajouté le ${date}</div>
        </div>
    `;
}

// Ajouter un nouveau bookmark
async function handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(addForm);
    const labels = formData.get('labels')
        .split(',')
        .map(l => l.trim())
        .filter(l => l !== '');

    const bookmark = {
        titre: formData.get('titre'),
        description: formData.get('description'),
        categorie: formData.get('categorie'),
        labels: labels,
        lien: formData.get('lien')
    };

    try {
        const response = await fetch('/api/bookmarks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookmark)
        });

        if (response.ok) {
            closeModal();
            await loadBookmarks();
            await loadCategories();
            showSuccess('Favori ajouté avec succès !');
        } else {
            showError('Erreur lors de l\'ajout du favori');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur lors de l\'ajout du favori');
    }
}

// Supprimer un bookmark
async function deleteBookmark(id) {
    if (!confirm('Voulez-vous vraiment supprimer ce favori ?')) {
        return;
    }

    try {
        const response = await fetch(`/api/bookmarks/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadBookmarks();
            await loadCategories();
            showSuccess('Favori supprimé');
        } else {
            showError('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur lors de la suppression');
    }
}

// Filtrer par catégorie
function filterByCategory(category) {
    currentCategory = category;

    // Mettre à jour les boutons actifs
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });

    // Filtrer les bookmarks
    if (category === 'all') {
        displayBookmarks(allBookmarks);
    } else {
        const filtered = allBookmarks.filter(b => b.categorie === category);
        displayBookmarks(filtered);
    }
}

// Recherche
let searchTimeout;
async function handleSearch(e) {
    const query = e.target.value.trim();

    // Debounce
    clearTimeout(searchTimeout);

    if (query === '') {
        displayBookmarks(allBookmarks);
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();
            displayBookmarks(results);
        } catch (error) {
            console.error('Erreur de recherche:', error);
        }
    }, 300);
}

// Messages de feedback
function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'error');
}

function showToast(message, type) {
    // Créer un toast simple
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Service Worker pour PWA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => console.log('Service Worker enregistré'))
            .catch(error => console.log('Erreur Service Worker:', error));
    }
}

// Animations CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
