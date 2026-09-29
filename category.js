;(async () => {
const whatsappNumber = '2347072305794';
const cartStorageKey = 'bastoCart';
let cartItems = [];
try {
    cartItems = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
} catch (error) {
    localStorage.removeItem(cartStorageKey);
}
const formatNaira = (amount) => `₦${Number(amount || 0).toLocaleString('en-NG')}`;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const safeImageUrl = (value) => String(value || '').replace(/["'()\\]/g, '');
const inventoryStorageKey = 'bastoInventory';
const categorySubcategories = {
    tops: ['Trending', 'Big Tops', 'Stretch Top', 'Small Polo'],
    pants: ['Baggy Jean', 'Stock Jean', 'Baggy Short Jean', 'Joggers Short', 'Joggers Long']
};
const pageSize = 20;
const availableProductCount = (items) => items.filter((item) => item.available !== false && Math.max(0, Number(item.stock ?? 1) - Number(item.sold ?? 0)) > 0).length;
let bindProductCards = () => {};
const supportedSizesFor = (item) => {
    const supportedSizes = item.category === 'pants'
        ? ['XL', '2XL', '3XL', '47', '48', '49', '50']
        : item.category === 'shoes'
            ? Array.from({ length: 11 }, (_, index) => String(36 + index))
        : ['cosmetics', 'watch-accessories'].includes(item.category) ? [] : ['L', 'XL', '2XL', '3XL'];
    return (item.sizes || []).map(String).filter((size) => supportedSizes.includes(size));
};
let adminInventory = [];
let inventoryLoadFailed = false;
try {
    adminInventory = window.bastoInventoryApi?.configured
        ? await window.bastoInventoryApi.listProducts()
        : (() => {
        try {
            const savedInventory = JSON.parse(localStorage.getItem(inventoryStorageKey) || '[]');
            return Array.isArray(savedInventory) ? savedInventory : [];
        } catch (error) {
            return [];
        }
    })();
} catch (error) {
    console.error('Could not load shared inventory.', error);
    inventoryLoadFailed = true;
}

const categoryId = window.location.pathname.split('/').pop().replace('.html', '');
const categorySection = document.querySelector('.category-page');
const categoryGrid = categorySection?.querySelector('.clothing-grid');
if (categoryGrid) categoryGrid.innerHTML = '';
const categoryItems = categoryId === 'new-arrivals'
    ? adminInventory
    : adminInventory.filter((item) => item.category === categoryId);
if (categoryId === 'pants' && categorySection) {
    categorySection.querySelector('h1').textContent = 'Trousers';
    document.title = document.title.replace('Pants', 'Trousers');
}
if (categorySection) {
    const countElement = categorySection.querySelector('.catalog-count');
    if (countElement) countElement.textContent = `${availableProductCount(categoryItems)} available`;
}
const activeCategorySubcategories = categorySubcategories[categoryId] || [];
let activeSubcategory = '';
let renderedProductCount = 0;
let visibleProductCount = pageSize;
let categoryFilters;
if (categorySection && activeCategorySubcategories.length) {
    categoryFilters = document.createElement('nav');
    categoryFilters.className = 'subcategory-navigation';
    categoryFilters.setAttribute('aria-label', `${categoryId === 'pants' ? 'Trousers' : 'Tops'} subcategories`);
    categoryFilters.innerHTML = `<button type="button" data-subcategory-filter="" aria-pressed="true">All</button>${activeCategorySubcategories.map((subcategory) => `<button type="button" data-subcategory-filter="${escapeHtml(subcategory)}" aria-pressed="false">${escapeHtml(subcategory)}</button>`).join('')}`;
    categorySection.querySelector('.section-heading').after(categoryFilters);
}
const showMoreButton = document.createElement('button');
showMoreButton.className = 'catalog-show-more';
showMoreButton.type = 'button';
showMoreButton.hidden = true;
showMoreButton.textContent = 'Show More';
if (categoryGrid) categoryGrid.after(showMoreButton);
const renderCategoryProducts = (reset = false) => {
    if (!categoryGrid) return;
    if (reset) {
        renderedProductCount = 0;
        visibleProductCount = pageSize;
        categoryGrid.replaceChildren();
    }
    const products = categoryItems.filter((item) => !activeSubcategory || item.subcategory === activeSubcategory);
    if (!products.length) {
        categoryGrid.innerHTML = inventoryLoadFailed
            ? '<p class="catalog-empty">The catalog is temporarily unavailable. Please try again later.</p>'
            : '<p class="catalog-empty">No items available in this category yet.</p>';
        showMoreButton.hidden = true;
        return;
    }
    const batch = products.slice(renderedProductCount, visibleProductCount);
    categoryGrid.insertAdjacentHTML('beforeend', batch.map((item) => {
        const remaining = Math.max(0, Number(item.stock ?? 1) - Number(item.sold ?? 0));
        const available = item.available !== false && remaining > 0;
        const imageSource = safeImageUrl(item.image);
        const sizes = supportedSizesFor(item);
        return `<article class="clothing-card" data-product-id="${escapeHtml(item.id)}" data-stock="${remaining}" data-description="${escapeHtml(item.description)}" data-sizes="${escapeHtml(sizes.join('|'))}" data-subcategory="${escapeHtml(item.subcategory || '')}" data-image="${escapeHtml(imageSource)}" data-available="${available}"><div class="clothing-image"${imageSource ? ` style="background-image: url('${imageSource}')"` : ''}>${available ? '' : '<span class="clothing-label sold-out-label">Sold out</span>'}</div><div class="clothing-details"><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><small class="stock-status">${available ? (remaining <= 2 ? `${remaining} pcs left` : `${remaining} pcs available`) : 'Sold out'}</small></div><strong>${formatNaira(Number(item.price))}</strong></div><button class="add-to-cart${available ? '' : ' sold-out-button'}" type="button"${available ? '' : ' disabled'}>${available ? 'Add to cart <span aria-hidden="true">+</span>' : 'Sold out'}</button></article>`;
    }).join(''));
    renderedProductCount += batch.length;
    bindProductCards(categoryGrid);
    showMoreButton.hidden = renderedProductCount >= products.length;
    showMoreButton.textContent = `Show More (${products.length - renderedProductCount})`;
};
renderCategoryProducts(true);

const headerActions = document.querySelector('.header-actions');
if (headerActions && !headerActions.querySelector('.cart-button')) {
    headerActions.insertAdjacentHTML('afterbegin', '<button class="icon-button cart-button" type="button" aria-label="Shopping cart, 0 items"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5h2l1.7 10.2h10.9L20.5 8H6.2"></path><circle cx="9" cy="19" r="1"></circle><circle cx="17" cy="19" r="1"></circle></svg><span class="cart-count">0</span></button>');
}

if (!document.getElementById('product-modal')) {
    document.body.insertAdjacentHTML('beforeend', `
<div class="product-modal" id="product-modal" hidden>
    <div class="product-modal-backdrop" data-close-product></div>
    <section class="product-modal-panel" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <button class="modal-close" type="button" aria-label="Close product details" data-close-product>×</button>
        <p class="eyebrow">Product details</p>
        <img class="modal-product-image" id="product-modal-image" alt="" hidden>
        <h2 id="product-modal-title"></h2>
        <p class="modal-description">A considered Basto Luxury &amp; Wears essential, designed for comfortable everyday wear and easy layering.</p>
        <div class="modal-specs"><p><span>Price</span><strong id="product-modal-price"></strong></p></div>
        <label class="size-label" for="product-size">Select size</label>
        <select id="product-size"><option value="">Choose a size</option><option>L</option><option>XL</option><option>2XL</option><option>3XL</option></select>
        <label class="size-label" for="product-quantity">Quantity</label>
        <input id="product-quantity" type="number" min="1" value="1">
        <button class="modal-add" type="button" id="modal-add-to-cart">Add to cart <span aria-hidden="true">+</span></button>
    </section>
</div>
<div class="product-image-viewer" id="product-image-viewer" hidden>
    <button class="image-viewer-close" type="button" aria-label="Close product image" data-close-image-viewer>×</button>
    <img id="product-image-viewer-image" alt="">
</div>
<aside class="cart-drawer" id="cart-drawer" aria-label="Shopping cart" aria-hidden="true">
    <div class="cart-drawer-header"><div><p class="eyebrow">Your selection</p><h2>Your cart</h2></div><button class="modal-close" type="button" aria-label="Close shopping cart" data-close-cart>×</button></div>
    <div class="cart-items" id="cart-items"><p class="cart-empty">Your cart is empty.</p></div>
    <div class="cart-drawer-footer"><div><span>Subtotal</span><strong id="cart-subtotal">₦0</strong></div><button class="modal-add" type="button" id="checkout-button">Checkout <span aria-hidden="true">→</span></button></div>
</aside>
<div class="cart-backdrop" data-close-cart></div>`);
}

const cartButton = document.querySelector('.cart-button');
const cartCount = document.querySelector('.cart-count');
const productModal = document.querySelector('#product-modal');
const modalImage = document.querySelector('#product-modal-image');
const imageViewer = document.querySelector('#product-image-viewer');
const imageViewerImage = document.querySelector('#product-image-viewer-image');
const cartDrawer = document.querySelector('#cart-drawer');
const cartItemsElement = document.querySelector('#cart-items');
const cartSubtotal = document.querySelector('#cart-subtotal');
const cartBackdrop = document.querySelector('.cart-backdrop');
const productQuantity = document.querySelector('#product-quantity');
const checkoutButton = document.querySelector('#checkout-button');
let selectedCard = null;

const getProductData = (card) => ({
	productId: card.dataset.productId || '',
    name: card.querySelector('h3').textContent,
    price: Number(card.querySelector('.clothing-details strong').textContent.replace(/[^0-9.]/g, '')),
    image: card.querySelector('.clothing-image').style.backgroundImage || getComputedStyle(card.querySelector('.clothing-image')).backgroundImage,
    stock: Number(card.dataset.stock || 1)
});

const renderCart = () => {
    if (!cartItemsElement || !cartCount || !cartSubtotal || !cartButton) return;
    localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    cartItemsElement.innerHTML = cartItems.length ? cartItems.map((item, index) => { const quantity = Number(item.quantity || 1); const productStock = Number(item.stock ?? 1); const productQuantity = cartItems.filter((cartItem) => item.productId ? cartItem.productId === item.productId : cartItem.name === item.name).reduce((total, cartItem) => total + Number(cartItem.quantity || 1), 0); const availableForItem = productStock - (productQuantity - quantity); const stockMessage = item.available === false || productStock <= 0 ? '<small class="stock-status cart-stock-status">Sold out</small>' : productQuantity > productStock ? `<small class="stock-status cart-stock-status">Only ${productStock} pcs available</small>` : ''; return `<div class="cart-item"><div class="cart-item-image" style="background-image: ${item.image}"></div><div><h3>${item.name}</h3><p>Size ${item.size}</p>${stockMessage}<div class="cart-quantity"><button type="button" aria-label="Decrease ${item.name} quantity" data-change-quantity="-1" data-item-index="${index}">−</button><span>${quantity} pcs</span><button type="button" aria-label="Increase ${item.name} quantity" data-change-quantity="1" data-item-index="${index}"${quantity >= availableForItem ? ' disabled' : ''}>+</button></div></div><strong>${formatNaira(item.price * quantity)}</strong><button type="button" aria-label="Remove ${item.name}" data-remove-item="${index}">×</button></div>`; }).join('') : '<p class="cart-empty">Your cart is empty.</p>';
    if (checkoutButton) checkoutButton.disabled = hasUnavailableCartItems();
    const totalQuantity = cartItems.reduce((total, item) => total + Number(item.quantity || 1), 0);
    cartCount.textContent = String(totalQuantity);
    cartSubtotal.textContent = formatNaira(cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0));
    cartButton.setAttribute('aria-label', `Shopping cart, ${totalQuantity} items`);
};

const hasUnavailableCartItems = () => cartItems.some((item) => {
    const productQuantity = cartItems
        .filter((cartItem) => item.productId ? cartItem.productId === item.productId : cartItem.name === item.name)
        .reduce((total, cartItem) => total + Number(cartItem.quantity || 1), 0);
    return item.available === false || productQuantity > Number(item.stock ?? 1);
});

const refreshCartStock = async () => {
    if (!window.bastoInventoryApi?.configured || !cartItems.length) return true;
    const products = await window.bastoInventoryApi.listProducts();
    cartItems.forEach((item) => {
        const product = (item.productId && products.find((entry) => String(entry.id) === String(item.productId)))
            || products.find((entry) => entry.name === item.name);
        if (!product) {
            item.stock = 0;
            item.available = false;
            return;
        }
        item.productId = product.id;
        item.stock = Math.max(0, Number(product.stock ?? 0) - Number(product.sold ?? 0));
        item.available = product.available !== false && item.stock > 0;
    });
    renderCart();
    return !hasUnavailableCartItems();
};

renderCart();

const addToCart = (card, size = 'M', quantity = 1) => {
    if (!card) return;
    const product = { ...getProductData(card), size, quantity };
    const productQuantityInCart = cartItems
        .filter((item) => item.name === product.name)
        .reduce((total, item) => total + Number(item.quantity || 1), 0);
    const remainingStock = Math.max(0, Number(product.stock || 1) - productQuantityInCart);
    if (!remainingStock) {
        window.alert(`All available ${product.name} items are already in your cart.`);
        return;
    }
    const existingItem = cartItems.find((item) => item.name === product.name && item.size === product.size);
    if (existingItem) {
        const nextQuantity = Number(existingItem.quantity || 1) + Number(quantity || 1);
        existingItem.quantity = Math.min(Number(product.stock || 1), nextQuantity);
    } else {
        cartItems.push({ ...product, quantity: Math.min(remainingStock, Number(quantity || 1)) });
    }
    renderCart();
};

const setCartOpen = (isOpen) => {
    if (!cartDrawer || !cartBackdrop) return;
    cartDrawer.classList.toggle('open', isOpen);
    cartDrawer.setAttribute('aria-hidden', String(!isOpen));
    cartBackdrop.classList.toggle('open', isOpen);
    if (isOpen) document.body.classList.add('modal-open');
    else if (!productModal || productModal.hidden) document.body.classList.remove('modal-open');
};

const openProductDetails = (card) => {
    if (!productModal || !document.querySelector('#product-modal-title') || !modalImage || !document.querySelector('#product-modal-price') || !document.querySelector('.modal-description') || !document.querySelector('#product-size') || !productQuantity || !document.querySelector('#modal-add-to-cart')) return;
    selectedCard = card;
    const product = getProductData(card);
    document.querySelector('#product-modal-title').textContent = product.name;
    modalImage.hidden = !card.dataset.image;
    if (card.dataset.image) {
        modalImage.src = card.dataset.image;
        modalImage.alt = `${product.name} product image`;
    }
    document.querySelector('#product-modal-price').textContent = formatNaira(product.price);
    document.querySelector('.modal-description').textContent = card.dataset.description || 'A considered Basto Luxury & Wears essential, designed for comfortable everyday wear and easy layering.';
    const sizeSelect = document.querySelector('#product-size');
    const sizes = card.hasAttribute('data-sizes') ? card.dataset.sizes.split('|').filter(Boolean) : ['L', 'XL', '2XL', '3XL'];
    const sizeLabel = document.querySelector('label[for="product-size"]');
    sizeLabel.hidden = sizes.length === 0;
    sizeSelect.hidden = sizes.length === 0;
    sizeSelect.disabled = sizes.length <= 1;
    sizeSelect.innerHTML = sizes.length === 1 ? `<option value="${escapeHtml(sizes[0])}">${escapeHtml(sizes[0])} available</option>` : '<option value="">Choose a size</option>';
    sizes.forEach((size) => sizeSelect.insertAdjacentHTML('beforeend', `<option>${escapeHtml(size)}</option>`));
    const available = card.dataset.available !== 'false';
    const quantityInCart = cartItems
        .filter((item) => item.name === product.name)
        .reduce((total, item) => total + Number(item.quantity || 1), 0);
    productQuantity.max = String(Math.max(0, Number(card.dataset.stock || 1) - quantityInCart));
    productQuantity.value = '1';
    productQuantity.disabled = !available || Number(productQuantity.max) < 1;
    const modalAddButton = document.querySelector('#modal-add-to-cart');
    modalAddButton.disabled = !available || Number(productQuantity.max) < 1;
    modalAddButton.textContent = available && Number(productQuantity.max) > 0 ? 'Add to cart +' : 'Sold out';
    sizeSelect.value = sizes.length === 1 ? sizes[0] : '';
    productModal.hidden = false;
    document.body.classList.add('modal-open');
};

const wireCategoryCard = (card) => {
    if (card.dataset.interactionsBound) return;
    card.dataset.interactionsBound = 'true';
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', (event) => {
        if (event.target.closest('.add-to-cart, .clothing-image')) return;
        openProductDetails(card);
    });
    card.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('.add-to-cart')) {
            event.preventDefault();
            openProductDetails(card);
        }
    });
    const button = card.querySelector('.add-to-cart');
    button?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const sizes = (card.dataset.sizes || '').split('|').filter(Boolean);
        if (Number(card.dataset.stock || 1) > 1 || sizes.length) {
            card.click();
            return;
        }
        addToCart(card, 'One size');
        button.classList.add('added');
        button.innerHTML = 'Added to cart <span aria-hidden="true">✓</span>';
    });
};
bindProductCards = (container = document) => {
    if (container.matches?.('.clothing-card')) wireCategoryCard(container);
    container.querySelectorAll('.clothing-card').forEach(wireCategoryCard);
};
bindProductCards();

const closeImageViewer = () => {
    imageViewer.hidden = true;
    if ((!productModal || productModal.hidden) && (!cartDrawer || !cartDrawer.classList.contains('open'))) {
        document.body.classList.remove('modal-open');
    }
};
document.addEventListener('click', (event) => {
    const imageTarget = event.target.closest('.clothing-image');
    if (imageTarget) {
        const card = imageTarget.closest('.clothing-card');
        const imageSource = card?.dataset.image || '';
        if (!imageSource) return;
        imageViewerImage.src = imageSource;
        imageViewerImage.alt = `${card.querySelector('h3')?.textContent || 'Product'} image`;
        imageViewer.hidden = false;
        document.body.classList.add('modal-open');
        return;
    }
    if (event.target === imageViewer || event.target.closest('[data-close-image-viewer]')) closeImageViewer();
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !imageViewer.hidden) closeImageViewer();
});

categoryFilters?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-subcategory-filter]');
    if (!button) return;
    activeSubcategory = button.dataset.subcategoryFilter || '';
    categoryFilters.querySelectorAll('[data-subcategory-filter]').forEach((filterButton) => {
        filterButton.setAttribute('aria-pressed', String(filterButton === button));
    });
    renderCategoryProducts(true);
});
showMoreButton.addEventListener('click', () => {
    visibleProductCount += pageSize;
    renderCategoryProducts();
});

document.querySelectorAll('[data-close-product]').forEach((control) => control.addEventListener('click', () => {
    if (productModal) productModal.hidden = true;
    if (!cartDrawer || !cartDrawer.classList.contains('open')) document.body.classList.remove('modal-open');
}));

document.querySelectorAll('[data-close-cart]').forEach((control) => control.addEventListener('click', () => setCartOpen(false)));
if (cartButton) cartButton.addEventListener('click', () => {
    setCartOpen(true);
    refreshCartStock().catch((error) => console.error('Could not refresh cart stock.', error));
});
window.setInterval(() => {
    if (cartDrawer?.classList.contains('open')) {
        refreshCartStock().catch((error) => console.error('Could not refresh cart stock.', error));
    }
}, 5000);

if (cartItemsElement) {
    cartItemsElement.addEventListener('click', (event) => {
        const quantityButton = event.target.closest('[data-change-quantity]');
        if (quantityButton) {
            const item = cartItems[Number(quantityButton.dataset.itemIndex)];
            if (!item) return;
            const nextQuantity = Number(item.quantity || 1) + Number(quantityButton.dataset.changeQuantity);
            const otherSizeQuantity = cartItems
                .filter((cartItem) => cartItem !== item && cartItem.name === item.name)
                .reduce((total, cartItem) => total + Number(cartItem.quantity || 1), 0);
            item.quantity = Math.max(1, Math.min(Number(item.stock || 1) - otherSizeQuantity, nextQuantity));
            renderCart();
            return;
        }
        const removeButton = event.target.closest('[data-remove-item]');
        if (!removeButton) return;
        cartItems.splice(Number(removeButton.dataset.removeItem), 1);
        renderCart();
    });
}

document.querySelector('#modal-add-to-cart')?.addEventListener('click', () => {
    if (selectedCard?.dataset.available === 'false') return;
    const sizeSelect = document.querySelector('#product-size');
    const size = sizeSelect && !sizeSelect.hidden ? sizeSelect.value : 'One size';
    if (!sizeSelect?.hidden && !size) {
        document.querySelector('#product-size')?.focus();
        return;
    }
    if (!selectedCard) return;
    const requestedQuantity = Number(productQuantity.value) || 1;
    const maximumQuantity = Number(productQuantity.max) || 1;
    if (requestedQuantity > maximumQuantity) {
        productQuantity.value = String(maximumQuantity);
        window.alert(`Only ${maximumQuantity} pcs left.`);
        return;
    }
    const quantity = Math.max(1, requestedQuantity);
    addToCart(selectedCard, size, quantity);
    document.querySelector('#modal-add-to-cart').textContent = 'Added to cart ✓';
});

document.querySelector('#checkout-button')?.addEventListener('click', async () => {
    if (!cartItems.length) {
        window.alert('Your cart is empty. Add an item before checking out.');
        return;
    }
    try {
        if (!await refreshCartStock()) {
            window.alert('One or more items in your cart are sold out or no longer available. Remove them to continue.');
            return;
        }
    } catch (error) {
        window.alert('Could not check current stock. Please try again.');
        return;
    }
    const orderLines = cartItems.map((item, index) => `${index + 1}. ${item.name} | Size: ${item.size} | Qty: ${item.quantity || 1} | ${formatNaira(item.price * Number(item.quantity || 1))}`);
    const message = `Hello Basto Luxury & Wears, I would like to place this order:\n\n${orderLines.join('\n')}\n\nSubtotal: ${formatNaira(cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0))}\n\nPayment options:\n1. Union Bank\nAccount number: 0221002585\nAccount name: Bato Luxury and Wears\n\n2. OPay\nAccount number: 7072305794\nAccount name: Babalola Oluwatosin\n\nPlease send your payment receipt to WhatsApp: +234 707 230 5794\n\nCustomer name:\nPhone number:\nDelivery address:\n\nThank you.`;
    sessionStorage.setItem('bastoCheckoutPending', 'true');
    window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
});

window.addEventListener('pageshow', () => {
    if (sessionStorage.getItem('bastoCheckoutPending') !== 'true') return;
    sessionStorage.removeItem('bastoCheckoutPending');
    localStorage.removeItem(cartStorageKey);
    window.location.replace('index.html');
});
})();
