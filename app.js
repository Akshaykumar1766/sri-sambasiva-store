const WHATSAPP_NUMBER = '919885543834';
const DEFAULT_ADMIN_PASSWORD = 'sambasiva1234';
const STORE_NAME = 'Sri Sambasiva Fancy & General Store';
const CURRENCY = '₹';
const LS_KEYS = {
  PRODUCTS: 'ss_products',
  CART: 'ss_cart',
  ORDERS: 'ss_orders',
  ADMIN_PASSWORD: 'ss_admin_pass',
  ADMIN_LOGGED: 'ss_admin_logged',
  BILL_COUNTER: 'ss_bill_counter'
};

// STORAGE HELPERS
function getFromStorage(key, defaultVal = []) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getDailyOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateKey = `${year}${month}${day}`;
  
  const lastDateKey = localStorage.getItem('ss_last_order_date');
  let dailyCounter = parseInt(localStorage.getItem('ss_daily_order_counter') || '0', 10);
  
  if (lastDateKey !== dateKey) {
    dailyCounter = 1;
    localStorage.setItem('ss_last_order_date', dateKey);
  } else {
    dailyCounter++;
  }
  
  localStorage.setItem('ss_daily_order_counter', dailyCounter);
  const seq = String(dailyCounter).padStart(3, '0');
  return `SS-${dateKey}-${seq}`;
}

// NAVIGATION
function navigateTo(view) {
  closeMobileMenu();

  const views = ['dashboard-view', 'products-view', 'cart-view', 'checkout-view', 'bill-view', 'admin-view'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = 'none';
  });

  if (view === 'admin' && !isAdminLoggedIn()) {
    showAdminLogin();
    return;
  }

  const activeView = document.getElementById(`${view}-view`);
  if (activeView) {
    activeView.style.display = 'block';
  } else {
    // Fallback if view not found
    document.getElementById('dashboard-view').style.display = 'block';
    view = 'dashboard';
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${view}`) link.classList.add('active');
  });

  if (window.location.hash !== `#${view}`) {
    window.history.pushState(null, null, `#${view}`);
  }

  if (view === 'products') renderProducts();
  if (view === 'cart') renderCart();
  if (view === 'checkout') renderCheckoutSummary();
  if (view === 'admin') renderAdminPanel();
  if (view === 'dashboard') renderDashboard();

  window.scrollTo(0, 0);
}

// DASHBOARD
function renderDashboard() {
  const products = getFromStorage(LS_KEYS.PRODUCTS);
  const orders = getFromStorage(LS_KEYS.ORDERS);
  
  // Update stats
  const statProducts = document.getElementById('stat-products');
  if (statProducts) statProducts.textContent = products.length;
  
  const statOrders = document.getElementById('stat-orders');
  if (statOrders) statOrders.textContent = orders.length;
  
  const categories = [...new Set(products.map(p => p.category))];
  const statCategories = document.getElementById('stat-categories');
  if (statCategories) statCategories.textContent = categories.length;
  
  // Render featured products (random 4, or first 4)
  const featured = products.slice(0, 8);
  const grid = document.getElementById('featured-products');
  if (grid) {
    grid.innerHTML = featured.map(p => createProductCard(p)).join('');
  }
}

// PRODUCTS
let currentCategory = 'All';

function renderProducts() {
  const products = getFromStorage(LS_KEYS.PRODUCTS);
  const searchInput = document.getElementById('search-input');
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  
  let filtered = products;
  if (currentCategory !== 'All') {
    filtered = filtered.filter(p => p.category === currentCategory);
  }
  if (searchTerm) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm));
  }
  
  const grid = document.getElementById('products-grid');
  const noProducts = document.getElementById('no-products');
  
  if (!grid || !noProducts) return;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    noProducts.style.display = 'block';
  } else {
    noProducts.style.display = 'none';
    grid.innerHTML = filtered.map(p => createProductCard(p)).join('');
  }
  
  renderCategoryFilters();
}

function renderCategoryFilters() {
  const products = getFromStorage(LS_KEYS.PRODUCTS);
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const container = document.getElementById('category-filters');
  if (!container) return;

  container.innerHTML = categories.map(cat => 
    `<button class="category-btn ${cat === currentCategory ? 'active' : ''}" onclick="filterByCategory('${cat}')">${cat}</button>`
  ).join('');
}

function filterByCategory(category) {
  currentCategory = category;
  renderProducts();
}

function filterProducts() {
  renderProducts();
}

function createProductCard(product) {
  const cart = getFromStorage(LS_KEYS.CART);
  const inCart = cart.find(c => c.productId === product.id);
  const imageUrl = window.getProductImageUrl ? window.getProductImageUrl(product.name, product.category) : '';
  
  return `
    <div class="product-card animate-slideUp">
      <div class="product-image">
        <img src="${imageUrl}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-info">
        <span class="product-category-label">${product.category}</span>
        <h3 class="product-name">${product.name}</h3>
        <p class="product-price">${CURRENCY}${product.price.toFixed(2)}</p>
        <button class="btn-add-cart ${inCart ? 'added' : ''}" onclick="addToCart('${product.id}')">
          <i class="fas ${inCart ? 'fa-check' : 'fa-cart-plus'}"></i>
          ${inCart ? ' Added' : ' Add to Cart'}
        </button>
      </div>
    </div>
  `;
}

// CART MANAGEMENT
function addToCart(productId) {
  let cart = getFromStorage(LS_KEYS.CART);
  const existing = cart.find(c => c.productId === productId);
  
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ productId, quantity: 1 });
  }
  
  saveToStorage(LS_KEYS.CART, cart);
  updateCartCount();
  showToast('Product added to cart!', 'success');
  
  // Re-render current view to update button state
  const currentView = getCurrentView();
  if (currentView === 'products' || currentView === 'dashboard') {
    currentView === 'products' ? renderProducts() : renderDashboard();
  }
}

function removeFromCart(productId) {
  let cart = getFromStorage(LS_KEYS.CART);
  cart = cart.filter(c => c.productId !== productId);
  saveToStorage(LS_KEYS.CART, cart);
  updateCartCount();
  renderCart();
}

function updateQuantity(productId, delta) {
  let cart = getFromStorage(LS_KEYS.CART);
  const item = cart.find(c => c.productId === productId);
  
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      cart = cart.filter(c => c.productId !== productId);
    }
  }
  
  saveToStorage(LS_KEYS.CART, cart);
  updateCartCount();
  renderCart();
}

function updateCartCount() {
  const cart = getFromStorage(LS_KEYS.CART);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const badge = document.getElementById('cart-count');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function renderCart() {
  const cart = getFromStorage(LS_KEYS.CART);
  const products = getFromStorage(LS_KEYS.PRODUCTS);
  const cartItemsEl = document.getElementById('cart-items');
  const emptyCart = document.getElementById('empty-cart');
  const cartSummary = document.querySelector('.cart-summary');
  
  if (!cartItemsEl || !emptyCart) return;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '';
    emptyCart.style.display = 'block';
    if (cartSummary) cartSummary.style.display = 'none';
    return;
  }
  
  emptyCart.style.display = 'none';
  if (cartSummary) cartSummary.style.display = 'block';
  
  let total = 0;
  cartItemsEl.innerHTML = cart.map(cartItem => {
    const product = products.find(p => p.id === cartItem.productId);
    if (!product) return '';
    
    const itemTotal = product.price * cartItem.quantity;
    total += itemTotal;
    const imageUrl = window.getProductImageUrl ? window.getProductImageUrl(product.name, product.category) : '';
    
    return `
      <div class="cart-item">
        <img src="${imageUrl}" alt="${product.name}" class="cart-item-image">
        <div class="cart-item-details">
          <h4 class="cart-item-name">${product.name}</h4>
          <p class="cart-item-price">${CURRENCY}${product.price.toFixed(2)}</p>
        </div>
        <div class="cart-item-quantity">
          <button class="qty-btn" onclick="updateQuantity('${product.id}', -1)">−</button>
          <span class="qty-display">${cartItem.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity('${product.id}', 1)">+</button>
        </div>
        <div class="cart-item-total">
          <p>${CURRENCY}${itemTotal.toFixed(2)}</p>
        </div>
        <button class="btn-remove" onclick="removeFromCart('${product.id}')" title="Remove">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }).join('');
  
  const cartTotalEl = document.getElementById('cart-total');
  if (cartTotalEl) cartTotalEl.textContent = total.toFixed(2);
}

// CHECKOUT & BILL
function renderCheckoutSummary() {
  const cart = getFromStorage(LS_KEYS.CART);
  const products = getFromStorage(LS_KEYS.PRODUCTS);
  
  if (cart.length === 0) {
    navigateTo('cart');
    return;
  }
  
  let total = 0;
  const checkoutItems = document.getElementById('checkout-items');
  if (!checkoutItems) return;

  checkoutItems.innerHTML = cart.map(cartItem => {
    const product = products.find(p => p.id === cartItem.productId);
    if (!product) return '';
    const itemTotal = product.price * cartItem.quantity;
    total += itemTotal;
    return `
      <div class="checkout-item">
        <span>${product.name} × ${cartItem.quantity}</span>
        <span>${CURRENCY}${itemTotal.toFixed(2)}</span>
      </div>
    `;
  }).join('');
  
  const checkoutTotalEl = document.getElementById('checkout-total');
  if (checkoutTotalEl) checkoutTotalEl.textContent = total.toFixed(2);
}

function placeOrder(e) {
  e.preventDefault();
  
  const customerName = document.getElementById('customer-name').value.trim();
  const customerPhone = document.getElementById('customer-phone').value.trim();
  
  if (!customerName || !customerPhone) {
    showToast('Please fill in all details', 'error');
    return;
  }
  
  if (!/^[0-9]{10}$/.test(customerPhone)) {
    showToast('Please enter a valid 10-digit phone number', 'error');
    return;
  }
  
  const cart = getFromStorage(LS_KEYS.CART);
  const products = getFromStorage(LS_KEYS.PRODUCTS);
  const billNo = getDailyOrderNumber();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  
  let total = 0;
  const orderItems = cart.map(cartItem => {
    const product = products.find(p => p.id === cartItem.productId);
    if (!product) return null;
    const itemTotal = product.price * cartItem.quantity;
    total += itemTotal;
    return {
      name: product.name,
      price: product.price,
      quantity: cartItem.quantity,
      total: itemTotal
    };
  }).filter(Boolean);
  
  // Create order object
  const order = {
    id: generateId(),
    billNo: billNo,
    date: dateStr,
    time: timeStr,
    timestamp: now.getTime(),
    customerName,
    customerPhone,
    items: orderItems,
    total
  };
  
  // Save order to history
  const orders = getFromStorage(LS_KEYS.ORDERS);
  orders.unshift(order); // newest first
  saveToStorage(LS_KEYS.ORDERS, orders);
  
  // Clear cart
  saveToStorage(LS_KEYS.CART, []);
  updateCartCount();
  
  // Store current order for bill display
  window.currentOrder = order;
  
  // Generate and show bill
  renderBill(order);
  navigateTo('bill');
  
  // Reset form
  document.getElementById('checkout-form').reset();
  
  showToast('Order placed successfully!', 'success');
}

function generateBillHtml(order) {
  let itemsHtml = order.items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.name}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-right">${CURRENCY}${item.price.toFixed(2)}</td>
      <td class="text-right">${CURRENCY}${item.total.toFixed(2)}</td>
    </tr>
  `).join('');
  
  return `
    <div class="bill-header">
      <h2>🏪 ${STORE_NAME}</h2>
      <p class="bill-subtitle">Fancy & General Store</p>
    </div>
    <div class="bill-divider">═══════════════════════════════════</div>
    <div class="bill-info">
      <div><strong>Bill No:</strong> ${order.billNo}</div>
      <div><strong>Date:</strong> ${order.date}</div>
      <div><strong>Time:</strong> ${order.time || ''}</div>
      <div><strong>Customer:</strong> ${order.customerName}</div>
      <div><strong>Phone:</strong> ${order.customerPhone}</div>
    </div>
    <div class="bill-divider">───────────────────────────────────</div>
    <table class="bill-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th class="text-center">Qty</th>
          <th class="text-right">Price</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div class="bill-divider">───────────────────────────────────</div>
    <div class="bill-total">
      <strong>TOTAL: ${CURRENCY}${order.total.toFixed(2)}</strong>
    </div>
    <div class="bill-divider">═══════════════════════════════════</div>
    <div class="bill-footer">
      <p>Thank you for shopping with us! 🙏</p>
      <p class="bill-small">Visit again - ${STORE_NAME}</p>
    </div>
  `;
}

function renderBill(order) {
  const billContainer = document.getElementById('bill-container');
  if (!billContainer) return;
  billContainer.innerHTML = generateBillHtml(order);
}

function printBill() {
  window.print();
}

function sendToWhatsApp() {
  const order = window.currentOrder;
  if (!order) return;
  
  let message = `🛒 *NEW ORDER - ${STORE_NAME}*\n`;
  message += `📋 Bill No: ${order.billNo}\n`;
  message += `📅 Date: ${order.date} ${order.time || ''}\n\n`;
  message += `👤 *Customer:* ${order.customerName}\n`;
  message += `📞 *Phone:* ${order.customerPhone}\n\n`;
  message += `📦 *ORDER DETAILS:*\n`;
  message += `─────────────────\n`;
  
  order.items.forEach((item, i) => {
    message += `${i + 1}. ${item.name} × ${item.quantity} = ${CURRENCY}${item.total.toFixed(2)}\n`;
  });
  
  message += `─────────────────\n`;
  message += `💰 *TOTAL: ${CURRENCY}${order.total.toFixed(2)}*\n\n`;
  message += `Thank you! 🙏`;
  
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
  window.open(url, '_blank');
}

// ADMIN BILL VIEWER FUNCTIONS
function viewOrderBill(orderId) {
  const orders = getFromStorage(LS_KEYS.ORDERS);
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  
  window.modalCurrentOrder = order;
  window.currentOrder = order;
  
  const container = document.getElementById('modal-bill-container');
  if (container) {
    container.innerHTML = generateBillHtml(order);
  }
  
  const modal = document.getElementById('bill-modal');
  if (modal) modal.style.display = 'flex';
}

function closeBillModal() {
  const modal = document.getElementById('bill-modal');
  if (modal) modal.style.display = 'none';
}

function printModalBill() {
  if (window.modalCurrentOrder) {
    window.currentOrder = window.modalCurrentOrder;
    renderBill(window.modalCurrentOrder);
  }
  window.print();
}

function sendModalBillToWhatsApp() {
  if (window.modalCurrentOrder) {
    window.currentOrder = window.modalCurrentOrder;
    sendToWhatsApp();
  }
}

function printOrderBill(orderId) {
  const orders = getFromStorage(LS_KEYS.ORDERS);
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  window.currentOrder = order;
  renderBill(order);
  window.print();
}

function sendOrderBillToWhatsApp(orderId) {
  const orders = getFromStorage(LS_KEYS.ORDERS);
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  window.currentOrder = order;
  sendToWhatsApp();
}

// ADMIN FUNCTIONS
function showAdminLogin() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) {
    modal.style.display = 'flex';
    const pwd = document.getElementById('admin-password');
    if (pwd) {
      pwd.value = '';
      pwd.focus();
    }
  }
}

function closeAdminLogin() {
  const modal = document.getElementById('admin-login-modal');
  if (modal) modal.style.display = 'none';
}

function adminLogin() {
  const password = document.getElementById('admin-password').value;
  const storedPassword = localStorage.getItem(LS_KEYS.ADMIN_PASSWORD) || DEFAULT_ADMIN_PASSWORD;
  
  if (password === storedPassword) {
    sessionStorage.setItem(LS_KEYS.ADMIN_LOGGED, 'true');
    closeAdminLogin();
    navigateTo('admin');
    renderAdminPanel();
    showToast('Welcome, Admin!', 'success');
  } else {
    showToast('Incorrect password!', 'error');
    document.getElementById('admin-password').value = '';
  }
}

function adminLogout() {
  sessionStorage.removeItem(LS_KEYS.ADMIN_LOGGED);
  navigateTo('dashboard');
  showToast('Logged out successfully', 'success');
}

function isAdminLoggedIn() {
  return sessionStorage.getItem(LS_KEYS.ADMIN_LOGGED) === 'true';
}

function renderAdminPanel() {
  renderAdminProducts();
  renderOrderHistory();
}

function switchAdminTab(tab) {
  const productsTab = document.getElementById('admin-products-tab');
  const ordersTab = document.getElementById('admin-orders-tab');
  const tabBtns = document.querySelectorAll('.admin-tab-btn');
  
  tabBtns.forEach(btn => btn.classList.remove('active'));
  
  if (tab === 'products') {
    if (productsTab) productsTab.style.display = 'block';
    if (ordersTab) ordersTab.style.display = 'none';
    if (tabBtns.length > 0) tabBtns[0].classList.add('active');
  } else {
    if (productsTab) productsTab.style.display = 'none';
    if (ordersTab) ordersTab.style.display = 'block';
    if (tabBtns.length > 1) tabBtns[1].classList.add('active');
  }
}

// CLOUD & SERVER SYNC (Firebase Realtime Database + Local Server)
const FIREBASE_DB_URL = 'https://sambasiva-store-default-rtdb.firebaseio.com';

async function saveProductsToCloud(products) {
  if (!FIREBASE_DB_URL) return;
  try {
    const endpoint = FIREBASE_DB_URL.replace(/\/$/, '') + '/products.json';
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(products)
    });
    if (res.ok) {
      console.log('✅ Synced to Firebase Cloud Database');
      showToast('Live Cloud updated! Visible on all devices.', 'success');
    }
  } catch (e) {
    console.warn('Firebase sync error:', e);
  }
}

async function loadProductsFromCloud() {
  if (!FIREBASE_DB_URL) return false;
  try {
    const endpoint = FIREBASE_DB_URL.replace(/\/$/, '') + '/products.json';
    const res = await fetch(endpoint);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveToStorage(LS_KEYS.PRODUCTS, data);
        renderDashboard();
        renderProducts();
        renderAdminProducts();
        return true;
      }
    }
  } catch (e) {
    console.warn('Firebase load error:', e);
  }
  return false;
}

async function saveProductsToServer(products) {
  // 1. Local Node server sync
  try {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(products)
    });
  } catch (e) {
    // offline or static CDN
  }

  // 2. Firebase Cloud sync (for live public site)
  await saveProductsToCloud(products);
}

async function loadProductsFromServer() {
  // 1. Try Firebase Cloud first (for public multi-device sync)
  const cloudSuccess = await loadProductsFromCloud();
  if (cloudSuccess) return;

  // 2. Try Local Server
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveToStorage(LS_KEYS.PRODUCTS, data);
        renderDashboard();
        renderProducts();
        renderAdminProducts();
        return;
      }
    }
  } catch (e) {
    // fallback
  }

  // 3. Fallback: products.json
  try {
    const res = await fetch('products.json?v=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        saveToStorage(LS_KEYS.PRODUCTS, data);
        renderDashboard();
        renderProducts();
        renderAdminProducts();
      }
    }
  } catch (e) {
    // offline
  }
}

// PRODUCT MANAGEMENT (ADMIN)
function addProduct(e) {
  if (e && e.preventDefault) e.preventDefault();
  
  const nameInput = document.getElementById('product-name');
  const priceInput = document.getElementById('product-price');
  const categoryInput = document.getElementById('product-category');
  
  const name = nameInput ? nameInput.value.trim() : '';
  const price = priceInput ? parseFloat(priceInput.value) : NaN;
  const category = categoryInput ? categoryInput.value : '';
  
  if (!name) {
    showToast('Please enter a product name', 'error');
    if (nameInput) nameInput.focus();
    return false;
  }
  
  if (isNaN(price) || price <= 0) {
    showToast('Please enter a valid price', 'error');
    if (priceInput) priceInput.focus();
    return false;
  }
  
  if (!category) {
    showToast('Please select a category', 'error');
    if (categoryInput) categoryInput.focus();
    return false;
  }
  
  const products = getFromStorage(LS_KEYS.PRODUCTS);
  
  const newProduct = {
    id: generateId(),
    name,
    price,
    category,
    createdAt: Date.now()
  };
  
  products.unshift(newProduct);
  saveToStorage(LS_KEYS.PRODUCTS, products);
  saveProductsToServer(products);
  
  // Clear form
  const form = document.getElementById('product-form');
  if (form) form.reset();
  
  renderAdminProducts();
  renderDashboard();
  renderProducts();
  showToast(`"${name}" added successfully!`, 'success');
  return false;
}

function renderAdminProducts() {
  const products = getFromStorage(LS_KEYS.PRODUCTS);
  const tbody = document.getElementById('product-list');
  if (!tbody) return;
  
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:2rem;color:#999;">No products added yet. Add your first product above!</td></tr>';
    return;
  }
  
  tbody.innerHTML = products.map(product => {
    let imageUrl = '';
    try {
      if (window.getProductImageUrl) {
        imageUrl = window.getProductImageUrl(product.name, product.category);
      }
    } catch (err) {
      console.error('Error generating image:', err);
    }
    return `
      <tr>
        <td><img src="${imageUrl}" alt="${product.name}" class="admin-product-img"></td>
        <td><strong>${product.name}</strong></td>
        <td>${CURRENCY}${product.price.toFixed(2)}</td>
        <td><span class="category-badge">${product.category}</span></td>
        <td class="admin-actions">
          <button class="btn-edit" onclick="editProduct('${product.id}')" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-delete" onclick="deleteProduct('${product.id}')" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function editProduct(productId) {
  const products = getFromStorage(LS_KEYS.PRODUCTS);
  const product = products.find(p => p.id === productId);
  
  if (!product) return;
  
  document.getElementById('edit-product-id').value = product.id;
  document.getElementById('edit-product-name').value = product.name;
  document.getElementById('edit-product-price').value = product.price;
  document.getElementById('edit-product-category').value = product.category;
  
  const editModal = document.getElementById('edit-modal');
  if (editModal) editModal.style.display = 'flex';
}

function closeEditModal() {
  const editModal = document.getElementById('edit-modal');
  if (editModal) editModal.style.display = 'none';
}

function saveEditProduct(e) {
  if (e && e.preventDefault) e.preventDefault();
  
  const id = document.getElementById('edit-product-id').value;
  const name = document.getElementById('edit-product-name').value.trim();
  const price = parseFloat(document.getElementById('edit-product-price').value);
  const category = document.getElementById('edit-product-category').value;
  
  if (!name || isNaN(price) || price <= 0) {
    showToast('Please fill in all fields correctly', 'error');
    return false;
  }
  
  const products = getFromStorage(LS_KEYS.PRODUCTS);
  const index = products.findIndex(p => p.id === id);
  
  if (index !== -1) {
    if (window.clearImageCache) {
      window.clearImageCache(products[index].name + products[index].category);
    }
    
    products[index].name = name;
    products[index].price = price;
    products[index].category = category;
    saveToStorage(LS_KEYS.PRODUCTS, products);
    saveProductsToServer(products);
    
    closeEditModal();
    renderAdminProducts();
    renderDashboard();
    renderProducts();
    showToast('Product updated successfully!', 'success');
  }
  return false;
}

function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  
  let products = getFromStorage(LS_KEYS.PRODUCTS);
  products = products.filter(p => p.id !== productId);
  saveToStorage(LS_KEYS.PRODUCTS, products);
  saveProductsToServer(products);
  
  // Also remove from cart
  let cart = getFromStorage(LS_KEYS.CART);
  cart = cart.filter(c => c.productId !== productId);
  saveToStorage(LS_KEYS.CART, cart);
  updateCartCount();
  
  renderAdminProducts();
  renderDashboard();
  renderProducts();
  showToast('Product deleted', 'success');
}

function clearAllProducts() {
  if (!confirm('Are you sure you want to clear ALL products? This cannot be undone.')) return;
  saveToStorage(LS_KEYS.PRODUCTS, []);
  saveToStorage(LS_KEYS.CART, []);
  saveProductsToServer([]);
  updateCartCount();
  renderAdminProducts();
  renderDashboard();
  renderProducts();
  showToast('All products have been cleared!', 'success');
}

function clearAllOrders() {
  if (!confirm('Are you sure you want to reset all orders to 0? This cannot be undone.')) return;
  saveToStorage(LS_KEYS.ORDERS, []);
  localStorage.setItem('ss_daily_order_counter', '0');
  renderOrderHistory();
  renderDashboard();
  showToast('Orders reset to 0!', 'success');
}

function deleteOrder(orderId) {
  let orders = getFromStorage(LS_KEYS.ORDERS);
  const order = orders.find(o => o.id === orderId);
  const billNo = order ? order.billNo : 'this order';
  
  if (!confirm(`Are you sure you want to delete order ${billNo}? This cannot be undone.`)) {
    return;
  }
  
  orders = orders.filter(o => o.id !== orderId);
  saveToStorage(LS_KEYS.ORDERS, orders);
  
  // Close bill modal if this order was open
  const modal = document.getElementById('bill-modal');
  if (modal && modal.style.display !== 'none' && window.modalCurrentOrder && window.modalCurrentOrder.id === orderId) {
    closeBillModal();
  }
  
  renderOrderHistory();
  renderDashboard();
  showToast(`Order ${billNo} deleted successfully`, 'success');
}

function deleteCurrentModalOrder() {
  if (window.modalCurrentOrder && window.modalCurrentOrder.id) {
    deleteOrder(window.modalCurrentOrder.id);
  }
}

// ORDER HISTORY (DAILY PATTERNED VIEW)
function renderOrderHistory() {
  const orders = getFromStorage(LS_KEYS.ORDERS);
  const container = document.getElementById('order-history');
  const statsBar = document.getElementById('order-stats-bar');
  if (!container) return;
  
  const now = new Date();
  const todayStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  const todayOrders = orders.filter(o => o.date === todayStr);
  const todaySales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalSales = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  if (statsBar) {
    statsBar.innerHTML = `
      <div style="background:var(--bg-main);padding:1rem;border-radius:var(--radius);text-align:center;border:1px solid var(--border);">
        <div style="font-size:1.5rem;font-weight:700;color:var(--primary);">${todayOrders.length}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);text-transform:uppercase;font-weight:600;">Today's Orders</div>
      </div>
      <div style="background:var(--bg-main);padding:1rem;border-radius:var(--radius);text-align:center;border:1px solid var(--border);">
        <div style="font-size:1.5rem;font-weight:700;color:var(--accent);">${CURRENCY}${todaySales.toFixed(2)}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);text-transform:uppercase;font-weight:600;">Today's Sales</div>
      </div>
      <div style="background:var(--bg-main);padding:1rem;border-radius:var(--radius);text-align:center;border:1px solid var(--border);">
        <div style="font-size:1.5rem;font-weight:700;color:var(--secondary);">${orders.length}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);text-transform:uppercase;font-weight:600;">Total Orders</div>
      </div>
      <div style="background:var(--bg-main);padding:1rem;border-radius:var(--radius);text-align:center;border:1px solid var(--border);">
        <div style="font-size:1.5rem;font-weight:700;color:var(--primary);">${CURRENCY}${totalSales.toFixed(2)}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);text-transform:uppercase;font-weight:600;">Total Sales</div>
      </div>
    `;
  }
  
  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list" style="font-size:3rem;color:#ccc;"></i><p style="color:#999;margin-top:1rem;">No orders yet (0 Orders). Customer orders will appear here automatically!</p></div>';
    return;
  }
  
  // Group orders by date
  const grouped = {};
  orders.forEach(order => {
    const d = order.date || 'Other Date';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(order);
  });
  
  let html = '';
  for (const date in grouped) {
    const dayOrders = grouped[date];
    const dayTotal = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const isToday = date === todayStr;
    
    html += `
      <div style="margin-bottom:1.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;background:${isToday ? 'var(--primary)' : '#4a5568'};color:white;padding:0.6rem 1rem;border-radius:8px;margin-bottom:0.8rem;font-weight:600;">
          <span><i class="fas fa-calendar-day"></i> ${isToday ? 'Today — ' : ''}${date}</span>
          <span>${dayOrders.length} ${dayOrders.length === 1 ? 'Order' : 'Orders'} • ${CURRENCY}${dayTotal.toFixed(2)}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.8rem;">
          ${dayOrders.map(order => `
            <div class="order-card" style="border:1px solid var(--border);border-radius:var(--radius);padding:1rem;background:white;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
              <div class="order-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;flex-wrap:wrap;gap:0.4rem;">
                <div>
                  <span class="order-bill-no" style="background:#e8f5e9;color:#2e7d32;padding:0.25rem 0.6rem;border-radius:4px;font-weight:700;font-size:0.9rem;letter-spacing:0.5px;">${order.billNo}</span>
                  <span class="order-date" style="margin-left:0.6rem;color:#666;font-size:0.85rem;"><i class="far fa-clock"></i> ${order.time || ''}</span>
                </div>
                <div class="order-total-badge" style="font-weight:700;font-size:1.1rem;color:var(--primary);">${CURRENCY}${order.total.toFixed(2)}</div>
              </div>
              <div class="order-customer" style="font-size:0.9rem;color:#555;margin-bottom:0.6rem;">
                <span><i class="fas fa-user"></i> <strong>${order.customerName}</strong></span> &nbsp;|&nbsp;
                <span><i class="fas fa-phone"></i> ${order.customerPhone}</span>
              </div>
              <div class="order-items-list" style="border-top:1px dashed #e0e0e0;padding-top:0.6rem;font-size:0.85rem;color:#444;">
                ${order.items.map(item => `
                  <div class="order-item-row" style="display:flex;justify-content:space-between;margin-bottom:0.25rem;">
                    <span>• ${item.name} × ${item.quantity}</span>
                    <span style="font-weight:500;">${CURRENCY}${item.total.toFixed(2)}</span>
                  </div>
                `).join('')}
              </div>
              <div class="order-actions-row" style="margin-top:0.8rem;padding-top:0.6rem;border-top:1px solid #f0f0f0;display:flex;justify-content:flex-end;gap:0.5rem;flex-wrap:wrap;align-items:center;">
                <button type="button" class="btn btn-danger" onclick="deleteOrder('${order.id}')" style="padding:0.35rem 0.8rem;font-size:0.82rem;display:inline-flex;align-items:center;gap:0.35rem;margin-right:auto;" title="Delete this order">
                  <i class="fas fa-trash-alt"></i> Delete Order
                </button>
                <button type="button" class="btn btn-primary" onclick="viewOrderBill('${order.id}')" style="padding:0.35rem 0.8rem;font-size:0.82rem;display:inline-flex;align-items:center;gap:0.35rem;">
                  <i class="fas fa-file-invoice"></i> View Bill
                </button>
                <button type="button" class="btn btn-secondary" onclick="printOrderBill('${order.id}')" style="padding:0.35rem 0.8rem;font-size:0.82rem;display:inline-flex;align-items:center;gap:0.35rem;">
                  <i class="fas fa-print"></i> Print
                </button>
                <button type="button" class="btn-whatsapp" onclick="sendOrderBillToWhatsApp('${order.id}')" style="padding:0.35rem 0.8rem;font-size:0.82rem;display:inline-flex;align-items:center;gap:0.35rem;">
                  <i class="fab fa-whatsapp"></i> WhatsApp
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// TOAST NOTIFICATION
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.style.display = 'block';
  // Force reflow so animation triggers
  toast.offsetHeight;
  toast.className = `toast show toast-${type}`;
  
  setTimeout(() => {
    toast.className = 'toast';
    setTimeout(() => {
      toast.style.display = '';
    }, 400);
  }, 3000);
}

// MOBILE MENU
function toggleMobileMenu() {
  const nav = document.getElementById('nav-links');
  const hamburger = document.querySelector('.hamburger');
  if (nav) nav.classList.toggle('mobile-open');
  if (hamburger) hamburger.classList.toggle('active');
}

// Close mobile menu when a nav link is clicked
function closeMobileMenu() {
  const nav = document.getElementById('nav-links');
  const hamburger = document.querySelector('.hamburger');
  if (nav) nav.classList.remove('mobile-open');
  if (hamburger) hamburger.classList.remove('active');
}

// HELPER: getCurrentView
function getCurrentView() {
  const views = ['dashboard', 'products', 'cart', 'checkout', 'bill', 'admin'];
  for (const view of views) {
    const el = document.getElementById(`${view}-view`);
    if (el && el.style.display !== 'none') return view;
  }
  return 'dashboard';
}

const DEFAULT_PRODUCTS = [];

// INITIALIZATION
function initApp() {
  // Set default admin password if not exists
  if (!localStorage.getItem(LS_KEYS.ADMIN_PASSWORD)) {
    localStorage.setItem(LS_KEYS.ADMIN_PASSWORD, DEFAULT_ADMIN_PASSWORD);
  }

  // One-time auto-wipe of initial sample products & reset orders to 0
  if (localStorage.getItem('ss_wiped_v3') !== 'true') {
    saveToStorage(LS_KEYS.PRODUCTS, []);
    saveToStorage(LS_KEYS.CART, []);
    saveToStorage(LS_KEYS.ORDERS, []);
    localStorage.setItem('ss_daily_order_counter', '0');
    localStorage.setItem('ss_wiped_v3', 'true');
  }
  
  // Set up checkout form handler
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.onsubmit = placeOrder;
    checkoutForm.addEventListener('submit', placeOrder);
  }
  
  // Set up product form handler  
  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.onsubmit = addProduct;
    productForm.addEventListener('submit', addProduct);
  }
  
  // Handle admin password enter key
  const adminPasswordInput = document.getElementById('admin-password');
  if (adminPasswordInput) {
    adminPasswordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') adminLogin();
    });
  }
  
  // Handle modal click-outside-to-close
  window.addEventListener('click', function(event) {
    const adminModal = document.getElementById('admin-login-modal');
    const editModal = document.getElementById('edit-modal');
    
    if (event.target === adminModal) {
      closeAdminLogin();
    }
    
    if (event.target === editModal) {
      closeEditModal();
    }
    
    if (event.target === billModal) {
      closeBillModal();
    }
  });
  
  // Handle hash navigation
  const hash = window.location.hash.slice(1);
  if (hash && ['dashboard', 'products', 'cart', 'checkout', 'admin'].includes(hash)) {
    navigateTo(hash);
  } else {
    navigateTo('dashboard');
  }
  
  updateCartCount();
  loadProductsFromServer();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

window.addEventListener('hashchange', function() {
  const hash = window.location.hash.slice(1);
  if (hash) navigateTo(hash);
});

// Explicit global exports for HTML event bindings
window.addProduct = addProduct;
window.saveEditProduct = saveEditProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.placeOrder = placeOrder;
window.navigateTo = navigateTo;
window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.switchAdminTab = switchAdminTab;
window.closeAdminLogin = closeAdminLogin;
window.closeEditModal = closeEditModal;
window.printBill = printBill;
window.sendToWhatsApp = sendToWhatsApp;
window.viewOrderBill = viewOrderBill;
window.closeBillModal = closeBillModal;
window.printModalBill = printModalBill;
window.sendModalBillToWhatsApp = sendModalBillToWhatsApp;
window.printOrderBill = printOrderBill;
window.sendOrderBillToWhatsApp = sendOrderBillToWhatsApp;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.filterByCategory = filterByCategory;
window.filterProducts = filterProducts;
window.clearAllProducts = clearAllProducts;
window.clearAllOrders = clearAllOrders;
window.deleteOrder = deleteOrder;
window.deleteCurrentModalOrder = deleteCurrentModalOrder;


