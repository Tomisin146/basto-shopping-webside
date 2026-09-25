const adminSessionKey = 'bastoAdminAuthenticated';
if (sessionStorage.getItem(adminSessionKey) !== 'true') window.location.replace('admin-login.html');

const inventoryStorageKey = 'bastoInventory';
const inventoryResetKey = 'bastoInventoryReset2026';
if (!localStorage.getItem(inventoryResetKey)) {
    localStorage.removeItem(inventoryStorageKey);
    localStorage.setItem(inventoryResetKey, 'true');
}
const categories = {
    tops: 'Tops',
    pants: 'Pants',
    shoes: 'Shoes',
    'watch-accessories': 'Watch & accessories',
    cap: 'Cap',
    cosmetics: 'Cosmetics',
    undies: 'Undies'
};

const form = document.querySelector('#product-form');
const productId = document.querySelector('#product-id');
const productName = document.querySelector('#product-name');
const productCategory = document.querySelector('#product-category');
const productDescription = document.querySelector('#product-description');
const productColors = document.querySelector('#product-colors');
const productPrice = document.querySelector('#product-price');
const productStock = document.querySelector('#product-stock');
const productSold = document.querySelector('#product-sold');
const productImage = document.querySelector('#product-image');
const productImageFile = document.querySelector('#product-image-file');
const productAvailable = document.querySelector('#product-available');
const saveButton = document.querySelector('#save-product');
const cancelEditButton = document.querySelector('#cancel-edit');
const formTitle = document.querySelector('#product-form-title');
const formStatus = document.querySelector('#form-status');
const inventoryList = document.querySelector('#inventory-list');
const logoutButton = document.querySelector('#admin-logout');

const readInventory = () => {
    try {
        const inventory = JSON.parse(localStorage.getItem(inventoryStorageKey) || '[]');
        return Array.isArray(inventory) ? inventory : [];
    } catch (error) {
        localStorage.removeItem(inventoryStorageKey);
        return [];
    }
};

let inventory = readInventory();

logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem(adminSessionKey);
    window.location.replace('admin-login.html');
});

const writeInventory = () => localStorage.setItem(inventoryStorageKey, JSON.stringify(inventory));
const makeId = () => window.crypto?.randomUUID?.() || `item-${Date.now()}`;
const formatPrice = (amount) => `₦${Number(amount).toLocaleString('en-NG')}`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const selectedSizes = () => [...document.querySelectorAll('input[name="size"]:checked')].map((input) => input.value);
const readImageFile = (file) => new Promise((resolve, reject) => {
    if (!file) {
        resolve('');
        return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        const image = new Image();
        image.addEventListener('load', () => {
            const maxDimension = 1200;
            const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
        });
        image.addEventListener('error', () => reject(new Error('The selected file is not a readable image.')));
        image.src = reader.result;
    });
    reader.addEventListener('error', reject);
    reader.readAsDataURL(file);
});

const resetForm = () => {
    form.reset();
    productId.value = '';
    productImageFile.required = true;
    productAvailable.checked = true;
    productStock.value = 1;
    productSold.value = 0;
    saveButton.textContent = 'Add item';
    cancelEditButton.hidden = true;
    formTitle.textContent = 'Add an item';
};

const renderInventory = () => {
    if (!inventory.length) {
        inventoryList.innerHTML = '<p class="admin-empty">No admin products yet. Add your first item here.</p>';
        return;
    }

    inventoryList.innerHTML = Object.entries(categories).map(([categoryId, categoryName]) => {
        const categoryItems = inventory.filter((item) => item.category === categoryId);
        if (!categoryItems.length) return '';
        return `<section class="admin-category-group"><h3 class="admin-category-title">${categoryName}</h3>${categoryItems.map((item) => {
            const remaining = Math.max(0, Number(item.stock ?? 1) - Number(item.sold ?? 0));
            return `<article class="admin-item">
        <div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(categories[item.category] || item.category)} · ${escapeHtml(item.colors)} · ${item.sizes.length ? escapeHtml(item.sizes.join(', ')) : 'One size'} · ${item.stock ?? 1} pcs total · ${item.sold ?? 0} sold · ${remaining} pcs left</p>
        </div>
        <div class="admin-item-meta"><strong>${formatPrice(item.price)}</strong><span class="${item.available && remaining ? '' : 'sold-out-label'}">${item.available && remaining ? `${remaining} pcs left` : 'Sold out'}</span></div>
        <div class="admin-actions">
            <button class="admin-secondary" type="button" data-action="toggle" data-id="${item.id}">${item.available ? 'Mark sold out' : 'Make available'}</button>
            <button class="admin-secondary" type="button" data-action="edit" data-id="${item.id}">Edit</button>
            <button class="admin-danger" type="button" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
    </article>`;
        }).join('')}</section>`;
    }).join('');
};

const startEdit = (item) => {
    productId.value = item.id;
    productName.value = item.name;
    productCategory.value = item.category;
    productDescription.value = item.description;
    productColors.value = item.colors;
    productPrice.value = item.price;
    productStock.value = item.stock ?? 1;
    productSold.value = item.sold ?? 0;
    productImage.value = item.image || '';
    productImageFile.required = false;
    productAvailable.checked = item.available;
    document.querySelectorAll('input[name="size"]').forEach((input) => {
        input.checked = item.sizes.includes(input.value);
    });
    saveButton.textContent = 'Update item';
    cancelEditButton.hidden = false;
    formTitle.textContent = 'Edit item';
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    saveButton.disabled = true;
    try {
        const uploadedImage = await readImageFile(productImageFile.files[0]);
        const item = {
            id: productId.value || makeId(),
            name: productName.value.trim(),
            category: productCategory.value,
            description: productDescription.value.trim(),
            sizes: selectedSizes(),
            colors: productColors.value.trim(),
            price: Number(productPrice.value),
            stock: Number(productStock.value),
            sold: Number(productSold.value),
            image: uploadedImage || productImage.value.trim(),
            available: productAvailable.checked
        };
        const existingIndex = inventory.findIndex((entry) => entry.id === item.id);
        if (existingIndex >= 0) inventory[existingIndex] = item;
        else inventory.unshift(item);
        writeInventory();
        renderInventory();
        formStatus.textContent = existingIndex >= 0 ? 'Item updated.' : 'Item added to inventory.';
        resetForm();
    } catch (error) {
        formStatus.textContent = 'Could not save this item. Try a smaller image file.';
    } finally {
        saveButton.disabled = false;
    }
});

cancelEditButton.addEventListener('click', () => {
    resetForm();
    formStatus.textContent = '';
});

inventoryList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const itemIndex = inventory.findIndex((item) => item.id === button.dataset.id);
    if (itemIndex < 0) return;
    const item = inventory[itemIndex];

    if (button.dataset.action === 'edit') {
        startEdit(item);
        return;
    }
    if (button.dataset.action === 'toggle') {
        item.available = !item.available;
        writeInventory();
        renderInventory();
        formStatus.textContent = `${item.name} is now ${item.available ? 'available' : 'sold out'}.`;
        return;
    }
    if (button.dataset.action === 'delete' && window.confirm(`Delete ${item.name}?`)) {
        inventory.splice(itemIndex, 1);
        writeInventory();
        renderInventory();
        formStatus.textContent = 'Item deleted.';
    }
});

renderInventory();
