const whatsappNumber = '2347072305794';
const cartStorageKey = 'bastoCart';
let cartItems = [];
try {
    cartItems = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
} catch (error) {
    localStorage.removeItem(cartStorageKey);
}
const formatNaira = (amount) => `₦${Number(amount || 0).toLocaleString('en-NG')}`;
const convertToNaira = (amount) => 10000 + Math.min(Math.round(amount * 50), 10000);
const inventoryStorageKey = 'bastoInventory';
const inventoryResetKey = 'bastoInventoryReset2026';
if (!localStorage.getItem(inventoryResetKey)) {
    localStorage.removeItem(inventoryStorageKey);
    localStorage.setItem(inventoryResetKey, 'true');
}
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const safeImageUrl = (value) => String(value || '').replace(/["'()\\]/g, '');
let adminInventory = [];
try {
    const savedInventory = JSON.parse(localStorage.getItem(inventoryStorageKey) || '[]');
    adminInventory = Array.isArray(savedInventory) ? savedInventory : [];
} catch (error) {
    localStorage.removeItem(inventoryStorageKey);
}

const categoryId = window.location.pathname.split('/').pop().replace('.html', '');
const categorySection = document.querySelector('.category-page');
const categoryGrid = categorySection?.querySelector('.clothing-grid');
if (categoryGrid) categoryGrid.innerHTML = '';
const categoryItems = adminInventory.filter((item) => item.category === categoryId);
if (categoryGrid && categoryItems.length) {
    categoryGrid.insertAdjacentHTML('beforeend', categoryItems.map((item) => {
        const remaining = Math.max(0, Number(item.stock ?? 1) - Number(item.sold ?? 0));
        const available = item.available !== false && remaining > 0;
        return `<article class="clothing-card" data-stock="${remaining}" data-description="${escapeHtml(item.description)}" data-sizes="${escapeHtml((item.sizes || []).join('|'))}" data-color="${escapeHtml(item.colors || 'Color not specified')}" data-available="${available}"><div class="clothing-image"${item.image ? ` style="background-image: url('${safeImageUrl(item.image)}')"` : ''}>${available ? '' : '<span class="clothing-label sold-out-label">Sold out</span>'}</div><div class="clothing-details"><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)} · ${escapeHtml(item.colors || 'Color not specified')}</p><small class="stock-status">${available ? (remaining <= 2 ? `${remaining} pcs left` : `${remaining} pcs available`) : 'Sold out'}</small></div><strong>$${Number(item.price)}</strong></div><button class="add-to-cart${available ? '' : ' sold-out-button'}" type="button"${available ? '' : ' disabled'}>${available ? 'Add to cart <span aria-hidden="true">+</span>' : 'Sold out'}</button></article>`;
    }).join(''));
    if (categorySection) categorySection.querySelector('.catalog-count').textContent = `${categoryGrid.querySelectorAll('.clothing-card').length} pieces`;
}
if (categorySection && !categoryItems.length) categorySection.querySelector('.catalog-count').textContent = '0 pieces';
if (categoryGrid && !categoryItems.length) categoryGrid.innerHTML = '<p class="catalog-empty">No items available in this category yet.</p>';

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
        <h2 id="product-modal-title"></h2>
        <p class="modal-description">A considered Basto Luxury &amp; Wears essential, designed for comfortable everyday wear and easy layering.</p>
        <div class="modal-specs"><p><span>Color</span><strong id="product-modal-color"></strong></p><p><span>Price</span><strong id="product-modal-price"></strong></p></div>
        <label class="size-label" for="product-size">Select size</label>
        <select id="product-size"><option value="">Choose a size</option><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option></select>
        <label class="size-label" for="product-quantity">Quantity</label>
        <input id="product-quantity" type="number" min="1" value="1">
        <button class="modal-add" type="button" id="modal-add-to-cart">Add to cart <span aria-hidden="true">+</span></button>
    </section>
</div>
<aside class="cart-drawer" id="cart-drawer" aria-label="Shopping cart" aria-hidden="true">
    <div class="cart-drawer-header"><div><p class="eyebrow">Your selection</p><h2>Your cart</h2></div><button class="modal-close" type="button" aria-label="Close shopping cart" data-close-cart>×</button></div>
    <div class="cart-items" id="cart-items"><p class="cart-empty">Your cart is empty.</p></div>
    <div class="cart-drawer-footer"><div><span>Subtotal</span><strong id="cart-subtotal">₦0</strong></div><button class="modal-add" type="button" id="checkout-button">Checkout <span aria-hidden="true">→</span></button></div>
</aside>
<div class="cart-backdrop" data-close-cart></div>`);
}

document.querySelectorAll('.clothing-details strong, .product-card small').forEach((priceElement) => {
    const originalPrice = Number(priceElement.textContent.replace(/[^0-9.]/g, ''));
    if (originalPrice) priceElement.textContent = formatNaira(convertToNaira(originalPrice));
});

const cartButton = document.querySelector('.cart-button');
const cartCount = document.querySelector('.cart-count');
const productModal = document.querySelector('#product-modal');
const cartDrawer = document.querySelector('#cart-drawer');
const cartItemsElement = document.querySelector('#cart-items');
const cartSubtotal = document.querySelector('#cart-subtotal');
const cartBackdrop = document.querySelector('.cart-backdrop');
const productQuantity = document.querySelector('#product-quantity');
let selectedCard = null;

const getProductData = (card) => ({
    name: card.querySelector('h3').textContent,
    color: card.querySelector('.clothing-details p').textContent.split('·').pop().trim(),
    price: Number(card.querySelector('.clothing-details strong').textContent.replace(/[^0-9.]/g, '')),
    image: card.querySelector('.clothing-image').style.backgroundImage || getComputedStyle(card.querySelector('.clothing-image')).backgroundImage,
    stock: Number(card.dataset.stock || 1)
});

const renderCart = () => {
    if (!cartItemsElement || !cartCount || !cartSubtotal || !cartButton) return;
    localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    cartItemsElement.innerHTML = cartItems.length ? cartItems.map((item, index) => { const quantity = Number(item.quantity || 1); const productQuantity = cartItems.filter((cartItem) => cartItem.name === item.name).reduce((total, cartItem) => total + Number(cartItem.quantity || 1), 0); const availableForItem = Number(item.stock || 1) - (productQuantity - quantity); return `<div class="cart-item"><div class="cart-item-image" style="background-image: ${item.image}"></div><div><h3>${item.name}</h3><p>${item.color} · Size ${item.size}</p><div class="cart-quantity"><button type="button" aria-label="Decrease ${item.name} quantity" data-change-quantity="-1" data-item-index="${index}">−</button><span>${quantity} pcs</span><button type="button" aria-label="Increase ${item.name} quantity" data-change-quantity="1" data-item-index="${index}"${quantity >= availableForItem ? ' disabled' : ''}>+</button></div></div><strong>${formatNaira(item.price * quantity)}</strong><button type="button" aria-label="Remove ${item.name}" data-remove-item="${index}">×</button></div>`; }).join('') : '<p class="cart-empty">Your cart is empty.</p>';
    const totalQuantity = cartItems.reduce((total, item) => total + Number(item.quantity || 1), 0);
    cartCount.textContent = String(totalQuantity);
    cartSubtotal.textContent = formatNaira(cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0));
    cartButton.setAttribute('aria-label', `Shopping cart, ${totalQuantity} items`);
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
    if (!productModal || !document.querySelector('#product-modal-title') || !document.querySelector('#product-modal-color') || !document.querySelector('#product-modal-price') || !document.querySelector('.modal-description') || !document.querySelector('#product-size') || !productQuantity || !document.querySelector('#modal-add-to-cart')) return;
    selectedCard = card;
    const product = getProductData(card);
    document.querySelector('#product-modal-title').textContent = product.name;
    document.querySelector('#product-modal-color').textContent = product.color;
    document.querySelector('#product-modal-price').textContent = formatNaira(product.price);
    document.querySelector('.modal-description').textContent = card.dataset.description || 'A considered Basto Luxury & Wears essential, designed for comfortable everyday wear and easy layering.';
    const sizeSelect = document.querySelector('#product-size');
    const sizes = (card.dataset.sizes || 'XS|S|M|L|XL').split('|').filter(Boolean);
    sizeSelect.disabled = sizes.length === 1;
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

document.querySelectorAll('.clothing-card').forEach((card) => {
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', (event) => {
        if (event.target.closest('.add-to-cart')) return;
        openProductDetails(card);
    });
    card.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('.add-to-cart')) {
            event.preventDefault();
            openProductDetails(card);
        }
    });
});

document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const card = button.closest('.clothing-card');
        if (!card) return;
        if (Number(card.dataset.stock || 1) > 1) {
            card.click();
            return;
        }
        addToCart(card);
        button.classList.add('added');
        button.innerHTML = 'Added to cart <span aria-hidden="true">✓</span>';
    });
});

document.querySelectorAll('[data-close-product]').forEach((control) => control.addEventListener('click', () => {
    if (productModal) productModal.hidden = true;
    if (!cartDrawer || !cartDrawer.classList.contains('open')) document.body.classList.remove('modal-open');
}));

document.querySelectorAll('[data-close-cart]').forEach((control) => control.addEventListener('click', () => setCartOpen(false)));
if (cartButton) cartButton.addEventListener('click', () => setCartOpen(true));

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
    const size = document.querySelector('#product-size')?.value;
    if (!size || !selectedCard) {
        document.querySelector('#product-size')?.focus();
        return;
    }
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

document.querySelector('#checkout-button')?.addEventListener('click', () => {
    if (!cartItems.length) {
        window.alert('Your cart is empty. Add an item before checking out.');
        return;
    }
    const orderLines = cartItems.map((item, index) => `${index + 1}. ${item.name} | Color: ${item.color} | Size: ${item.size} | Qty: ${item.quantity || 1} | ${formatNaira(item.price * Number(item.quantity || 1))}`);
    const message = `Hello Basto Luxury & Wears, I would like to place this order:\n\n${orderLines.join('\n')}\n\nSubtotal: ${formatNaira(cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0))}\n\nPayment options:\n1. Union Bank\nAccount number: 0221002585\nAccount name: Bato Luxury and Wears\n\n2. OPay\nAccount number: 7072305794\nAccount name: Babalola Oluwatosin\n\nPlease send your payment receipt to WhatsApp: +234 707 230 5794\n\nCustomer name:\nPhone number:\nDelivery address:\n\nThank you.`;
    sessionStorage.setItem('bastoCheckoutPending', 'true');
    window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
});

window.addEventListener('pageshow', () => {
    if (sessionStorage.getItem('bastoCheckoutPending') !== 'true') return;
    sessionStorage.removeItem('bastoCheckoutPending');
    window.location.reload();
});
