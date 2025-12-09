/* --- GLOBAL THEME MANAGEMENT --- */
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

if (localStorage.getItem('theme') === 'dark') {
    body.classList.add('dark-mode');
    if(themeToggleBtn) themeToggleBtn.textContent = 'Açık Tema';
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.textContent = 'Açık Tema';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggleBtn.textContent = 'Koyu Tema';
        }
    });
}

/* --- AUTHENTICATION --- */
function getCurrentUserEmail() {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.email : 'guest';
}

function handleLogin() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;

    if (username && email) {
        const user = { username, email };
        localStorage.setItem('user', JSON.stringify(user));
        alert("Giriş Başarılı!");
        checkAuthStatus();
        
        // Initialize user data if needed
        initializeUserData();
        
        // Refresh UI
        loadDropdowns();
        renderProducts();
        if (typeof renderGallery === "function") renderGallery();
    } else {
        alert("Lütfen tüm alanları doldurun.");
    }
}

function handleLogout() {
    localStorage.removeItem('user');
    window.location.reload();
}

function checkAuthStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    const authSection = document.getElementById('auth-section');
    const welcomeSection = document.getElementById('welcome-section');
    const displayUsername = document.getElementById('display-username');

    if (user) {
        if(authSection) authSection.style.display = 'none';
        if(welcomeSection) welcomeSection.style.display = 'block';
        if(displayUsername) displayUsername.textContent = user.username;
    }
}

/* --- DATA MANAGEMENT --- */

// Default Data (Used if user has no custom settings)
const defaultCategories = ["Elektronik", "Giyim", "Ev & Yaşam", "Kozmetik: Cilt Bakımı", "Market"];
const defaultPriorities = [
    { name: "Yüksek", color: "#e74c3c" }, // Red
    { name: "Orta", color: "#f39c12" },   // Orange
    { name: "Düşük", color: "#2ecc71" }   // Green
];

// Initialize data for new users
function initializeUserData() {
    const email = getCurrentUserEmail();
    if (email === 'guest') return;

    // Check Categories
    if (!localStorage.getItem(`cats_${email}`)) {
        localStorage.setItem(`cats_${email}`, JSON.stringify(defaultCategories));
    }
    // Check Priorities
    if (!localStorage.getItem(`prios_${email}`)) {
        localStorage.setItem(`prios_${email}`, JSON.stringify(defaultPriorities));
    }
}

// Getters
function getUserCategories() {
    const email = getCurrentUserEmail();
    const data = localStorage.getItem(`cats_${email}`);
    return data ? JSON.parse(data) : defaultCategories;
}

function getUserPriorities() {
    const email = getCurrentUserEmail();
    const data = localStorage.getItem(`prios_${email}`);
    return data ? JSON.parse(data) : defaultPriorities;
}

// Function to populate Select Inputs in Dashboard
function loadDropdowns() {
    const catSelect = document.getElementById('p-category');
    const prioSelect = document.getElementById('p-priority');
    
    // Only run if elements exist
    if (!catSelect || !prioSelect) return;

    const categories = getUserCategories();
    const priorities = getUserPriorities();

    // Fill Categories
    catSelect.innerHTML = '';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        catSelect.appendChild(option);
    });

    // Fill Priorities
    prioSelect.innerHTML = '';
    priorities.forEach(prio => {
        const option = document.createElement('option');
        // Store name and color in value separated by '|' delimiter
        option.value = `${prio.name}|${prio.color}`; 
        option.textContent = prio.name;
        option.style.color = prio.color; // Visual hint in dropdown
        prioSelect.appendChild(option);
    });
}

/* --- PRODUCT MANAGEMENT --- */

function getProducts() {
    const userEmail = getCurrentUserEmail();
    const storageKey = `products_${userEmail}`;
    const products = localStorage.getItem(storageKey);
    return products ? JSON.parse(products) : [];
}

function handleAddProduct(event) {
    event.preventDefault();

    if (getCurrentUserEmail() === 'guest') {
        alert("Lütfen giriş yapın.");
        return;
    }

    // Parse Priority Value (Name|Color)
    const rawPriority = document.getElementById('p-priority').value; 
    const [prioName, prioColor] = rawPriority.split('|');

    const newProduct = {
        id: Date.now(),
        name: document.getElementById('p-name').value,
        image: document.getElementById('p-image').value || 'https://via.placeholder.com/150',
        category: document.getElementById('p-category').value,
        priorityName: prioName,
        priorityColor: prioColor,
        price: parseFloat(document.getElementById('p-price').value),
        shipping: parseFloat(document.getElementById('p-shipping').value),
        vendor: document.getElementById('p-vendor').value,
        notes: document.getElementById('p-notes').value
    };

    const products = getProducts();
    products.push(newProduct);
    
    const userEmail = getCurrentUserEmail();
    localStorage.setItem(`products_${userEmail}`, JSON.stringify(products));

    alert("Ürün Eklendi!");
    event.target.reset();
    renderProducts();
}

function renderProducts() {
    const tbody = document.getElementById('product-list-body');
    if (!tbody) return;

    const products = getProducts();
    tbody.innerHTML = '';

    products.forEach(product => {
        const totalCost = product.price + product.shipping;
        
        // Handle categories with sub-categories (split by ':')
        // Example: "Cilt Bakımı: Nemlendirici" -> Main: Cilt Bakımı, Sub: Nemlendirici
        let catDisplay = product.category;
        if(product.category.includes(':')) {
            const parts = product.category.split(':');
            catDisplay = `<strong>${parts[0]}</strong> <br> ↳ ${parts[1]}`;
        }

        const row = `
            <tr>
                <td><input type="checkbox" class="product-select" value="${product.id}"></td>
                <td><img src="${product.image}" class="product-thumb"></td>
                <td>
                    <strong>${product.name}</strong><br>
                    <small style="color:var(--text-muted);">${catDisplay}</small>
                </td>
                <td>
                    ${product.price} + ${product.shipping} = <strong>${totalCost} TL</strong>
                </td>
                <td>
                    <span class="badge" style="background-color: ${product.priorityColor}">
                        ${product.priorityName}
                    </span>
                </td>
                <td>
                    <button onclick="deleteProduct(${product.id})" class="btn btn-danger" style="padding:5px 10px;">Sil</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function deleteProduct(id) {
    if(confirm('Silmek istediğinize emin misiniz?')) {
        let products = getProducts();
        products = products.filter(p => p.id !== id);
        const userEmail = getCurrentUserEmail();
        localStorage.setItem(`products_${userEmail}`, JSON.stringify(products));
        renderProducts();
        if (typeof renderGallery === "function") renderGallery();
    }
}

function calculateBestBasket() {
    const checkboxes = document.querySelectorAll('.product-select:checked');
    const products = getProducts();
    let total = 0;
    let count = 0;

    checkboxes.forEach(box => {
        const product = products.find(p => p.id == box.value);
        if (product) {
            total += (product.price + product.shipping);
            count++;
        }
    });

    const resultBox = document.getElementById('calculation-result');
    if (count > 0) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `<strong>Sepet Özeti:</strong> ${count} ürün. <br> Toplam: <strong>${total} TL</strong>`;
    } else {
        alert("Lütfen ürün seçin.");
        resultBox.style.display = 'none';
    }
}

/* --- SETTINGS MODAL LOGIC (NEW) --- */
const settingsModal = document.getElementById('settings-modal');

function openSettingsModal() {
    if(settingsModal) {
        settingsModal.style.display = "block";
        renderSettingsLists();
    }
}

function closeSettingsModal() {
    if(settingsModal) {
        settingsModal.style.display = "none";
        // Reload dropdowns in main form to show changes
        loadDropdowns();
    }
}

function renderSettingsLists() {
    const catList = document.getElementById('settings-cat-list');
    const prioList = document.getElementById('settings-prio-list');
    
    // Render Categories
    const categories = getUserCategories();
    catList.innerHTML = '';
    categories.forEach((cat, index) => {
        catList.innerHTML += `
            <li>
                ${cat} 
                <span class="delete-icon" onclick="removeCategory(${index})">&times;</span>
            </li>`;
    });

    // Render Priorities
    const priorities = getUserPriorities();
    prioList.innerHTML = '';
    priorities.forEach((prio, index) => {
        prioList.innerHTML += `
            <li>
                <span style="color:${prio.color}; font-weight:bold;">${prio.name}</span>
                <span class="delete-icon" onclick="removePriority(${index})">&times;</span>
            </li>`;
    });
}

// Add/Remove Category
function addCategory() {
    const main = document.getElementById('new-cat-main').value;
    const sub = document.getElementById('new-cat-sub').value;
    
    if(!main) return alert("Ana kategori ismi gerekli.");
    
    let finalCat = main;
    if(sub) finalCat += `: ${sub}`; // Format: "Main: Sub"

    const categories = getUserCategories();
    categories.push(finalCat);
    
    const email = getCurrentUserEmail();
    localStorage.setItem(`cats_${email}`, JSON.stringify(categories));
    
    document.getElementById('new-cat-main').value = '';
    document.getElementById('new-cat-sub').value = '';
    renderSettingsLists();
}

function removeCategory(index) {
    const categories = getUserCategories();
    categories.splice(index, 1);
    localStorage.setItem(`cats_${getCurrentUserEmail()}`, JSON.stringify(categories));
    renderSettingsLists();
}

// Add/Remove Priority
function addPriority() {
    const name = document.getElementById('new-prio-name').value;
    const color = document.getElementById('new-prio-color').value;

    if(!name) return alert("Etiket ismi gerekli.");

    const priorities = getUserPriorities();
    priorities.push({ name: name, color: color });

    localStorage.setItem(`prios_${getCurrentUserEmail()}`, JSON.stringify(priorities));

    document.getElementById('new-prio-name').value = '';
    renderSettingsLists();
}

function removePriority(index) {
    const priorities = getUserPriorities();
    priorities.splice(index, 1);
    localStorage.setItem(`prios_${getCurrentUserEmail()}`, JSON.stringify(priorities));
    renderSettingsLists();
}

/* --- GALLERY LOGIC --- */
function renderGallery() {
    const galleryContainer = document.getElementById('dynamic-gallery');
    const noMsg = document.getElementById('no-images-msg');
    if (!galleryContainer) return;

    const products = getProducts();
    galleryContainer.innerHTML = '';

    if (products.length === 0) {
        if(noMsg) noMsg.style.display = 'block';
        return;
    } else {
        if(noMsg) noMsg.style.display = 'none';
    }

    products.forEach(product => {
        const imgHTML = `
            <div style="position: relative;">
                <img 
                    src="${product.image}" 
                    alt="${product.name}" 
                    onclick="openModal(this)"
                    onerror="this.src='https://via.placeholder.com/300?text=Resim+Yok'"
                >
                <p style="text-align:center; font-size:0.9rem; margin-top:5px; color:var(--text-main);">
                    ${product.name}
                </p>
            </div>
        `;
        galleryContainer.innerHTML += imgHTML;
    });
}
const modal = document.getElementById("image-modal");
const modalImg = document.getElementById("modal-img");
const captionText = document.getElementById("caption");
function openModal(element) {
    if(modal) {
        modal.style.display = "block";
        modalImg.src = element.src;
        captionText.innerHTML = element.alt;
    }
}
function closeModal() {
    if(modal) modal.style.display = "none";
}

/* --- INITILAZATION --- */
window.onload = function() {
    checkAuthStatus();
    initializeUserData(); // Veri yoksa varsayılanları yükle
    loadDropdowns();      // Formdaki selectleri doldur
    renderProducts();
    renderGallery();
};