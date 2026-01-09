// Configuration
const API_BASE_URL = 'https://trackify-it.vercel.app';

// DOM Elements
const loginSection = document.getElementById('loginSection');
const mainContent = document.getElementById('mainContent');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const productUrlInput = document.getElementById('productUrlInput');
const addProductBtn = document.getElementById('addProductBtn');
const productsList = document.getElementById('productsList');
const statusMessage = document.getElementById('statusMessage');
const optionsLink = document.getElementById('optionsLink');
const adminOptionsContainer = document.getElementById('adminOptionsContainer');

// State
let currentUser = null;

// Initialize the extension
document.addEventListener('DOMContentLoaded', initializeExtension);

async function initializeExtension() {
  // Try to get user session from the main app
  const user = await getUserSession();
  if (user) {
    currentUser = user;
    await storeUser(user);
    showMainContent();
    loadTrackedProducts();
  } else {
    // Check if user is already logged in via storage
    const savedUser = await getStoredUser();
    if (savedUser) {
      currentUser = savedUser;
      showMainContent();
      loadTrackedProducts();
    } else {
      showLoginSection();
    }
  }

  // Check if current user is admin and show/hide admin options
  const isAdmin = await checkIfAdmin(currentUser);
  if (isAdmin) {
    adminOptionsContainer.style.display = 'block';
  } else {
    adminOptionsContainer.style.display = 'none';
  }

  // Set up event listeners
  setupEventListeners();
}

function setupEventListeners() {
  // Google login button
  googleLoginBtn.addEventListener('click', handleGoogleLogin);
  logoutBtn.addEventListener('click', handleLogout);

  // Add product button
  addProductBtn.addEventListener('click', addProduct);

  // Options link
  optionsLink.addEventListener('click', openOptionsPage);
}

async function openOptionsPage() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

async function handleGoogleLogin() {
  // Redirect user to the main app where they can click the Google login button
  chrome.tabs.create({ url: `${API_BASE_URL}/` });
  window.close(); // Close the popup
}

async function handleLogout() {
  currentUser = null;
  await clearStoredUser();
  showLoginSection();
  showStatus('Logged out successfully', 'success');
}

function showLoginSection() {
  loginSection.style.display = 'block';
  mainContent.style.display = 'none';
}

function showMainContent() {
  loginSection.style.display = 'none';
  mainContent.style.display = 'block';
  userName.textContent = `Welcome, ${currentUser.name || currentUser.email || 'User'}!`;
}

async function addProduct() {
  const url = productUrlInput.value.trim();

  if (!url) {
    showStatus('Please enter a product URL', 'error');
    return;
  }

  try {
    // Send request to add product to tracking using session-based auth
    const response = await fetch(`${API_BASE_URL}/api/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url }),
      credentials: 'include' // Include cookies for session
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        showStatus('Product added successfully!', 'success');
        productUrlInput.value = '';
        loadTrackedProducts(); // Refresh the list
      } else {
        showStatus(result.error || 'Failed to add product', 'error');
      }
    } else {
      showStatus('Failed to add product to tracking', 'error');
    }
  } catch (error) {
    showStatus(`Error adding product: ${error.message}`, 'error');
  }
}

async function loadTrackedProducts() {
  if (!currentUser) return;

  try {
    // Show loading state
    productsList.innerHTML = '<div class="loading">Loading tracked products...</div>';

    // Fetch products from the backend using session-based auth
    const response = await fetch(`${API_BASE_URL}/api/track`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Include cookies for session
    });

    if (response.ok) {
      const result = await response.json();
      if (result.products) {
        displayProducts(result.products);
      } else {
        productsList.innerHTML = '<p>No products tracked yet.</p>';
      }
    } else {
      productsList.innerHTML = '<p>Error loading products.</p>';
    }
  } catch (error) {
    productsList.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

function displayProducts(products) {
  if (products.length === 0) {
    productsList.innerHTML = '<p>No products tracked yet.</p>';
    return;
  }

  productsList.innerHTML = '';

  products.forEach(product => {
    const productElement = document.createElement('div');
    productElement.className = 'product-item';
    productElement.innerHTML = `
      <h4>${product.name || 'Unnamed Product'}</h4>
      <div class="product-price">${product.currency} ${Number(product.current_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
      <div class="product-url">${product.url}</div>
      <button class="delete-btn" data-product-id="${product.id}">Remove</button>
    `;

    // Add event listener to delete button
    const deleteBtn = productElement.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteProduct(product.id));

    productsList.appendChild(productElement);
  });
}

async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to remove this product from tracking?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/app/auth/callback/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'DeleteProduct',
        productId: productId
      }),
      credentials: 'include' // Include cookies for session
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        showStatus('Product removed successfully', 'success');
        loadTrackedProducts(); // Refresh the list
      } else {
        showStatus(result.error || 'Failed to remove product', 'error');
      }
    } else {
      showStatus('Failed to remove product', 'error');
    }
  } catch (error) {
    showStatus(`Error removing product: ${error.message}`, 'error');
  }
}

// Function to get user session from the main app
async function getUserSession() {
  try {
    // Try to get user info from the main app
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'GET',
      credentials: 'include' // Include cookies for session
    });

    if (response.ok) {
      const userData = await response.json();
      return userData.user;
    }
    return null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;

  // Auto-hide success messages after 3 seconds
  if (type === 'success') {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 3000);
  } else {
    statusMessage.style.display = 'block';
  }
}

// Check if user is an admin
async function checkIfAdmin(user) {
  if (!user || !user.email) {
    return false;
  }

  // Check if user is in the admin list stored in extension storage
  return new Promise((resolve) => {
    chrome.storage.sync.get(['adminEmails'], (result) => {
      const adminEmails = result.adminEmails || [];
      resolve(adminEmails.includes(user.email));
    });
  });
}

// Storage functions
async function getStoredUser() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['user'], (result) => {
      resolve(result.user || null);
    });
  });
}

async function storeUser(user) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ user }, () => {
      resolve();
    });
  });
}

async function clearStoredUser() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['user'], () => {
      resolve();
    });
  });
}