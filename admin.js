;(async () => {
const inventoryStorageKey = 'bastoInventory';
const categoryPreferenceKey = 'bastoLastProductCategory';
const categories = {
    tops: 'Tops',
    pants: 'Pants',
    shoes: 'Shoes',
    'watch-accessories': 'Watch & accessories',
    cap: 'Cap',
    cosmetics: 'Cosmetics',
    undies: 'Undies'
};
const maxVisibleInventoryItems = 10;
const expandedInventoryCategories = new Set();
const categoriesWithoutSizes = new Set(['cosmetics', 'watch-accessories']);

const form = document.querySelector('#product-form');
const productId = document.querySelector('#product-id');
const productName = document.querySelector('#product-name');
const productCategory = document.querySelector('#product-category');
const sizeOptions = document.querySelector('#size-options');
const sizeField = document.querySelector('#size-field');
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

const inventoryApi = window.bastoInventoryApi;
let inventory = [];

if (!inventoryApi?.configured) {
    formStatus.textContent = 'Connect this site to Supabase before managing inventory. See SUPABASE_SETUP.md.';
    return;
}

const { data: sessionData } = await inventoryApi.client.auth.getSession();
if (!sessionData.session) {
    window.location.replace('admin-login.html');
    return;
}

logoutButton.addEventListener('click', async () => {
    await inventoryApi.client.auth.signOut();
    window.location.replace('admin-login.html');
});

const readLegacyInventory = () => {
    try {
        const saved = JSON.parse(localStorage.getItem(inventoryStorageKey) || '[]');
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
};
const makeId = () => window.crypto?.randomUUID?.() || `item-${Date.now()}`;
const formatPrice = (amount) => `₦${Number(amount).toLocaleString('en-NG')}`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const safeImageSource = (value) => {
    const image = String(value || '');
    return /^https?:\/\//i.test(image) || /^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(image) ? image : '';
};
const selectedSizes = () => [...document.querySelectorAll('input[name="size"]:checked')].map((input) => input.value);
const renderSizeOptions = (selected = []) => {
    const hasSizes = !categoriesWithoutSizes.has(productCategory.value);
    sizeField.hidden = !hasSizes;
    if (!hasSizes) {
        sizeOptions.replaceChildren();
        return;
    }
    const sizes = productCategory.value === 'shoes'
        ? Array.from({ length: 11 }, (_, index) => String(36 + index))
        : ['XS', 'S', 'M', 'L', 'XL'];
    const selectedValues = selected.map(String);
    sizeOptions.innerHTML = sizes.map((size) => `<label><input type="checkbox" name="size" value="${size}"${selectedValues.includes(size) ? ' checked' : ''}> ${size}</label>`).join('');
};
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
    const selectedCategory = productCategory.value;
    form.reset();
    productCategory.value = selectedCategory;
    localStorage.setItem(categoryPreferenceKey, selectedCategory);
    renderSizeOptions();
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
        const expanded = expandedInventoryCategories.has(categoryId);
        const visibleItems = expanded ? categoryItems : categoryItems.slice(0, maxVisibleInventoryItems);
        const itemCards = visibleItems.map((item) => {
            const remaining = Math.max(0, Number(item.stock ?? 1) - Number(item.sold ?? 0));
            const imageSource = safeImageSource(item.image);
            return `<article class="admin-item">
        <div class="admin-item-image">${imageSource ? `<img src="${escapeHtml(imageSource)}" alt="${escapeHtml(item.name)}" loading="lazy">` : '<span>No image</span>'}</div>
        <div class="admin-item-details">
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(categories[item.category] || item.category)} · ${escapeHtml(item.colors)} · ${(item.sizes || []).length ? escapeHtml(item.sizes.join(', ')) : 'One size'} · ${item.stock ?? 1} pcs total · ${item.sold ?? 0} sold · ${remaining} pcs left</p>
        </div>
        <div class="admin-item-meta"><strong>${formatPrice(item.price)}</strong><span class="${item.available && remaining ? '' : 'sold-out-label'}">${item.available && remaining ? `${remaining} pcs left` : 'Sold out'}</span></div>
        <div class="admin-item-actions">
            <button class="admin-secondary" type="button" data-action="toggle" data-id="${item.id}">${item.available ? 'Mark sold out' : 'Make available'}</button>
            <button class="admin-secondary" type="button" data-action="edit" data-id="${item.id}">Edit</button>
            <button class="admin-danger" type="button" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
    </article>`;
        }).join('');
        const showMoreButton = categoryItems.length > maxVisibleInventoryItems
            ? `<button class="admin-secondary admin-show-more" type="button" data-action="show-more" data-category="${categoryId}" aria-expanded="${expanded}">${expanded ? 'Show less' : `Show more (${categoryItems.length - maxVisibleInventoryItems})`}</button>`
            : '';
        return `<section class="admin-category-group"><h3 class="admin-category-title">${categoryName} <span>(${categoryItems.length})</span></h3>${itemCards}${showMoreButton}</section>`;
    }).join('');
    inventoryList.querySelectorAll('.admin-item-image img').forEach((image) => {
        image.addEventListener('error', () => {
            image.parentElement.textContent = 'Image unavailable';
        }, { once: true });
    });
};

const startEdit = (item) => {
    productId.value = item.id;
    productName.value = item.name;
    productCategory.value = item.category;
    localStorage.setItem(categoryPreferenceKey, item.category);
    renderSizeOptions(item.sizes || []);
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

const preferredCategory = localStorage.getItem(categoryPreferenceKey);
if (categories[preferredCategory]) productCategory.value = preferredCategory;
productCategory.addEventListener('change', () => {
    localStorage.setItem(categoryPreferenceKey, productCategory.value);
    renderSizeOptions();
});
renderSizeOptions();

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
        await inventoryApi.saveProduct(item);
        if (existingIndex >= 0) inventory[existingIndex] = item;
        else inventory.unshift(item);
        renderInventory();
        formStatus.textContent = existingIndex >= 0 ? 'Item updated.' : 'Item added to inventory.';
        resetForm();
    } catch (error) {
        formStatus.textContent = error.message || 'Could not save this item. Try a smaller image file.';
    } finally {
        saveButton.disabled = false;
    }
});

cancelEditButton.addEventListener('click', () => {
    resetForm();
    formStatus.textContent = '';
});

inventoryList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    if (button.dataset.action === 'show-more') {
        const categoryId = button.dataset.category;
        if (expandedInventoryCategories.has(categoryId)) expandedInventoryCategories.delete(categoryId);
        else expandedInventoryCategories.add(categoryId);
        renderInventory();
        return;
    }
    const itemIndex = inventory.findIndex((item) => item.id === button.dataset.id);
    if (itemIndex < 0) return;
    const item = inventory[itemIndex];

    if (button.dataset.action === 'edit') {
        startEdit(item);
        return;
    }
    if (button.dataset.action === 'toggle') {
        item.available = !item.available;
        try {
            await inventoryApi.saveProduct(item);
            renderInventory();
            formStatus.textContent = `${item.name} is now ${item.available ? 'available' : 'sold out'}.`;
        } catch (error) {
            item.available = !item.available;
            formStatus.textContent = error.message || 'Could not update this item.';
        }
        return;
    }
    if (button.dataset.action === 'delete' && window.confirm(`Delete ${item.name}?`)) {
        inventory.splice(itemIndex, 1);
        try {
            await inventoryApi.deleteProduct(item.id);
            renderInventory();
            formStatus.textContent = 'Item deleted.';
        } catch (error) {
            inventory.splice(itemIndex, 0, item);
            formStatus.textContent = error.message || 'Could not delete this item.';
        }
    }
});

try {
    inventory = await inventoryApi.listProducts();
    const legacyInventory = readLegacyInventory();
    if (!inventory.length && legacyInventory.length) {
        for (const item of legacyInventory) await inventoryApi.saveProduct(item);
        inventory = await inventoryApi.listProducts();
        localStorage.removeItem(inventoryStorageKey);
        formStatus.textContent = 'Saved items from this browser to shared inventory.';
    }
    renderInventory();
} catch (error) {
    formStatus.textContent = error.message || 'Could not load shared inventory.';
}
})();
