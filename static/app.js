// État de l'application
let allBookmarks = [];
let currentCategory = 'all';
let editingBookmarkId = null;
let categoryCounts = {};

// Éléments du DOM
const addBtn = document.getElementById('addBtn');
const addModal = document.getElementById('addModal');
const addForm = document.getElementById('addForm');
const cancelBtn = document.getElementById('cancelBtn');
const closeBtn = document.querySelector('.close');
const bookmarksList = document.getElementById('bookmarksList');
const searchInput = document.getElementById('searchInput');
const categoryList = document.getElementById('categoryList');
const modalTitle = document.getElementById('modalTitle');
const submitBtn = document.getElementById('submitBtn');
const searchZone = document.getElementById('searchZone');
const resultsZone = document.getElementById('resultsZone');
const resultsTitle = document.getElementById('resultsTitle');
const clearResults = document.getElementById('clearResults');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.querySelector('.sidebar');

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    loadBookmarks();
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
    clearResults.addEventListener('click', clearSearchResults);
    mobileMenuToggle.addEventListener('click', toggleMobileSidebar);

    // Fermer le modal en cliquant à l'extérieur
    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) closeModal();
    });

    // Fermer la sidebar mobile en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !mobileMenuToggle.contains(e.target) &&
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
}

// Toggle mobile sidebar
function toggleMobileSidebar() {
    sidebar.classList.toggle('open');
}

// Ouvrir/Fermer le modal
function openModal() {
    editingBookmarkId = null;
    modalTitle.textContent = 'Ajouter une note';
    submitBtn.textContent = 'Ajouter';
    addModal.classList.add('active');
    document.getElementById('titre').focus();
}

function closeModal() {
    addModal.classList.remove('active');
    addForm.reset();
    editingBookmarkId = null;
}

// Charger tous les bookmarks
async function loadBookmarks() {
    try {
        const response = await fetch('/api/bookmarks');
        allBookmarks = await response.json();
        await loadCategories();
        updateCategoryCounts();
    } catch (error) {
        console.error('Erreur lors du chargement des bookmarks:', error);
        showError('Impossible de charger les notes');
    }
}

// Charger les catégories
async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        const categories = await response.json();

        const categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = '';

        // Compter les notes par catégorie
        categoryCounts = { all: allBookmarks.length };
        allBookmarks.forEach(bookmark => {
            categoryCounts[bookmark.categorie] = (categoryCounts[bookmark.categorie] || 0) + 1;
        });

        // Créer les éléments de catégorie dans la sidebar
        const firstItem = categoryList.querySelector('li');
        // Mettre à jour le compteur "Toutes les notes"
        document.getElementById('count-all').textContent = categoryCounts.all;

        categories.forEach(category => {
            // Ajouter au datalist
            const option = document.createElement('option');
            option.value = category;
            categoriesList.appendChild(option);

            // Ajouter à la sidebar
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.className = 'category-item';
            btn.dataset.category = category;
            btn.innerHTML = `
                <span class="category-name">${category}</span>
                <span class="category-count">${categoryCounts[category] || 0}</span>
            `;
            btn.addEventListener('click', () => filterByCategory(category));
            li.appendChild(btn);
            categoryList.appendChild(li);
        });
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
    }
}

// Mettre à jour les compteurs de catégories
function updateCategoryCounts() {
    categoryCounts = { all: allBookmarks.length };
    allBookmarks.forEach(bookmark => {
        categoryCounts[bookmark.categorie] = (categoryCounts[bookmark.categorie] || 0) + 1;
    });

    // Mettre à jour l'affichage des compteurs
    document.querySelectorAll('.category-item').forEach(btn => {
        const category = btn.dataset.category;
        const countSpan = btn.querySelector('.category-count');
        if (countSpan) {
            countSpan.textContent = categoryCounts[category] || 0;
        }
    });
}

// Afficher les bookmarks
function displayBookmarks(bookmarks, title = '') {
    bookmarksList.innerHTML = bookmarks.map(bookmark => createBookmarkCard(bookmark)).join('');

    // Afficher la zone de résultats
    searchZone.style.display = 'none';
    resultsZone.style.display = 'block';
    resultsTitle.textContent = title || `${bookmarks.length} note${bookmarks.length > 1 ? 's' : ''}`;

    // Ajouter les event listeners pour les boutons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteBookmark(btn.dataset.id));
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editBookmark(btn.dataset.id));
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
                <div class="bookmark-actions">
                    <button class="edit-btn" data-id="${bookmark.id}" title="Modifier">✏️</button>
                    <button class="delete-btn" data-id="${bookmark.id}" title="Supprimer">×</button>
                </div>
            </div>
            ${descriptionHTML}
            <span class="bookmark-category">${bookmark.categorie}</span>
            ${labelsHTML}
            ${linkHTML}
            <div class="bookmark-date">Ajouté le ${date}</div>
        </div>
    `;
}

// Ajouter ou modifier un bookmark
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
        let response;
        let successMessage;

        if (editingBookmarkId) {
            // Mode édition
            response = await fetch(`/api/bookmarks/${editingBookmarkId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookmark)
            });
            successMessage = 'Note modifiée avec succès !';
        } else {
            // Mode ajout
            response = await fetch('/api/bookmarks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookmark)
            });
            successMessage = 'Note ajoutée avec succès !';
        }

        if (response.ok) {
            closeModal();
            await loadBookmarks();
            showSuccess(successMessage);

            // Rafraîchir l'affichage si on est dans une vue filtrée
            if (resultsZone.style.display === 'block') {
                filterByCategory(currentCategory);
            }
        } else {
            showError('Erreur lors de l\'opération');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur lors de l\'opération');
    }
}

// Supprimer un bookmark
async function deleteBookmark(id) {
    if (!confirm('Voulez-vous vraiment supprimer cette note ?')) {
        return;
    }

    try {
        const response = await fetch(`/api/bookmarks/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadBookmarks();
            showSuccess('Note supprimée');

            // Rafraîchir l'affichage si on est dans une vue filtrée
            if (resultsZone.style.display === 'block') {
                filterByCategory(currentCategory);
            }
        } else {
            showError('Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur:', error);
        showError('Erreur lors de la suppression');
    }
}

// Éditer un bookmark
function editBookmark(id) {
    const bookmark = allBookmarks.find(b => b.id === parseInt(id));
    if (!bookmark) return;

    // Passer en mode édition
    editingBookmarkId = id;
    modalTitle.textContent = 'Modifier la note';
    submitBtn.textContent = 'Modifier';

    // Pré-remplir le formulaire
    document.getElementById('titre').value = bookmark.titre;
    document.getElementById('description').value = bookmark.description || '';
    document.getElementById('categorie').value = bookmark.categorie;
    document.getElementById('labels').value = bookmark.labels.join(', ');
    document.getElementById('lien').value = bookmark.lien || '';

    // Ouvrir le modal
    addModal.classList.add('active');
    document.getElementById('titre').focus();
}

// Filtrer par catégorie
function filterByCategory(category) {
    currentCategory = category;

    // Mettre à jour les boutons actifs
    document.querySelectorAll('.category-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });

    // Filtrer les bookmarks
    let filtered;
    let title;

    if (category === 'all') {
        filtered = allBookmarks;
        title = 'Toutes les notes';
    } else {
        filtered = allBookmarks.filter(b => b.categorie === category);
        title = category;
    }

    displayBookmarks(filtered, title);

    // Fermer le menu mobile si ouvert
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

// Recherche
let searchTimeout;
async function handleSearch(e) {
    const query = e.target.value.trim();

    // Debounce
    clearTimeout(searchTimeout);

    if (query === '') {
        clearSearchResults();
        return;
    }

    searchTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const results = await response.json();

            if (results.length > 0) {
                displayBookmarks(results, `Résultats pour "${query}"`);
            } else {
                // Afficher un message si aucun résultat
                searchZone.style.display = 'none';
                resultsZone.style.display = 'block';
                resultsTitle.textContent = `Aucun résultat pour "${query}"`;
                bookmarksList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Aucune note trouvée.</p>';
            }
        } catch (error) {
            console.error('Erreur de recherche:', error);
        }
    }, 300);
}

// Effacer les résultats
function clearSearchResults() {
    searchInput.value = '';
    searchZone.style.display = 'flex';
    resultsZone.style.display = 'none';
    currentCategory = 'all';

    // Réinitialiser les catégories actives
    document.querySelectorAll('.category-item').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all') {
            btn.classList.add('active');
        }
    });
}

// Messages de feedback
function showSuccess(message) {
    showToast(message, 'success');
}

function showError(message) {
    showToast(message, 'error');
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
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
