// API Configuration
const API_BASE_URL = '/api/products';

// State Management
let currentDeleteId = null;
let isSearchMode = false;
let currentSearchTerm = '';

// DOM Elements
const productForm = document.getElementById('productForm');
const productsList = document.getElementById('productsList');
const loadingSpinner = document.getElementById('loadingSpinner');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const productCount = document.getElementById('productCount');
const formTitle = document.getElementById('formTitle');
const cancelBtn = document.getElementById('cancelBtn');

// API Helper Function
async function apiRequest(endpoint = '', method = 'GET', data = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        let url = API_BASE_URL;
        if (endpoint) {
            url = `${API_BASE_URL}/${endpoint}`;
        }
        
        if (method === 'GET' && isSearchMode && currentSearchTerm) {
            url = `/api/products?search=${encodeURIComponent(currentSearchTerm)}`;
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }
        
        if (method === 'DELETE') {
            return { success: true };
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

// Load Products
async function loadProducts() {
    showLoading();
    
    try {
        let products;
        if (isSearchMode && currentSearchTerm) {
            products = await apiRequest(`?search=${currentSearchTerm}`, 'GET');
        } else {
            products = await apiRequest('', 'GET');
        }
        
        if (!products || products.length === 0) {
            const message = isSearchMode ? 'No products found matching your search.' : 'No products found. Add your first product!';
            displayEmptyState(message);
            productCount.textContent = '0 products';
            return;
        }
        
        displayProducts(products);
        productCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;
    } catch (error) {
        displayEmptyState('Error loading products. Please try again.');
    } finally {
        hideLoading();
    }
}

// Display Products
function displayProducts(products) {
    if (!products || products.length === 0) {
        displayEmptyState('No products found.');
        return;
    }
    
    productsList.innerHTML = products.map(product => `
        <div class="product-card" data-id="${product.id}">
            <h3>${escapeHtml(product.name)}</h3>
            ${product.category ? `<div class="product-category">📁 ${escapeHtml(product.category)}</div>` : ''}
            <p class="product-description">${escapeHtml(product.description || 'No description provided.')}</p>
            <div class="product-details">
                <span class="product-price">$${parseFloat(product.price).toFixed(2)}</span>
                <span class="product-quantity">📦 Stock: ${product.quantity}</span>
            </div>
            <div class="product-meta">
                <small>📅 Created: ${product.created_at || 'N/A'}</small><br>
                <small>🔄 Updated: ${product.updated_at || 'N/A'}</small>
            </div>
            <div class="card-actions">
                <button class="btn btn-edit" onclick="editProduct(${product.id})">
                    ✏️ Edit
                </button>
                <button class="btn btn-danger" onclick="showDeleteModal(${product.id})">
                    🗑️ Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Display Empty State
function displayEmptyState(message) {
    productsList.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <p>${escapeHtml(message)}</p>
        </div>
    `;
}

// Create or Update Product
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const productId = document.getElementById('productId').value;
    const productData = {
        name: document.getElementById('name').value.trim(),
        description: document.getElementById('description').value.trim(),
        category: document.getElementById('category').value,
        price: parseFloat(document.getElementById('price').value),
        quantity: parseInt(document.getElementById('quantity').value)
    };
    
    // Validation
    if (!productData.name) {
        showToast('Product name is required!', 'error');
        return;
    }
    
    if (isNaN(productData.price) || productData.price < 0) {
        showToast('Valid price is required!', 'error');
        return;
    }
    
    if (isNaN(productData.quantity) || productData.quantity < 0) {
        showToast('Valid quantity is required!', 'error');
        return;
    }
    
    try {
        if (productId) {
            await apiRequest(productId, 'PUT', productData);
            showToast('Product updated successfully!', 'success');
        } else {
            await apiRequest('', 'POST', productData);
            showToast('Product created successfully!', 'success');
        }
        
        resetForm();
        await loadProducts();
    } catch (error) {
        showToast(`Error: ${error.message}`, 'error');
    }
});

// Edit Product
window.editProduct = async (id) => {
    try {
        const product = await apiRequest(id, 'GET');
        
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('name').value = product.name;
            document.getElementById('description').value = product.description || '';
            document.getElementById('category').value = product.category || '';
            document.getElementById('price').value = product.price;
            document.getElementById('quantity').value = product.quantity;
            formTitle.innerHTML = '✏️ Edit Product';
            cancelBtn.classList.remove('hidden');
            
            // Scroll to form
            document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        showToast(`Error loading product: ${error.message}`, 'error');
    }
};

// Delete Product
window.showDeleteModal = (id) => {
    currentDeleteId = id;
    document.getElementById('deleteModal').classList.remove('hidden');
};

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (currentDeleteId) {
        try {
            await apiRequest(currentDeleteId, 'DELETE');
            showToast('Product deleted successfully!', 'success');
            
            // Clear search if in search mode
            if (isSearchMode) {
                clearSearch();
            }
            
            await loadProducts();
        } catch (error) {
            showToast(`Error deleting product: ${error.message}`, 'error');
        } finally {
            closeDeleteModal();
        }
    }
});

document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
    currentDeleteId = null;
}

// Search Functionality
searchBtn.addEventListener('click', async () => {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) {
        isSearchMode = true;
        currentSearchTerm = searchTerm;
        await loadProducts();
        showToast(`Showing results for: "${searchTerm}"`, 'info');
    } else {
        showToast('Please enter a search term', 'info');
    }
});

clearSearchBtn.addEventListener('click', clearSearch);

async function clearSearch() {
    searchInput.value = '';
    isSearchMode = false;
    currentSearchTerm = '';
    await loadProducts();
    showToast('Showing all products', 'info');
}

// Search on Enter key
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Reset Form
function resetForm() {
    productForm.reset();
    document.getElementById('productId').value = '';
    formTitle.innerHTML = '➕ Add New Product';
    cancelBtn.classList.add('hidden');
}

cancelBtn.addEventListener('click', resetForm);

// Toast Notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Loading States
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    productsList.classList.add('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
    productsList.classList.remove('hidden');
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});