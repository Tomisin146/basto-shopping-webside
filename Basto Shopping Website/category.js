const whatsappNumber = '2347072305794';
const cartItems = [];
const formatNaira = (amount) => `₦${amount.toLocaleString('en-NG')}`;
const convertToNaira = (amount) => 10000 + Math.min(Math.round(amount * 50), 10000);

const headerActions = document.querySelector('.header-actions');
headerActions.insertAdjacentHTML('afterbegin', '<button class="icon-button cart-button" type="button" aria-label="Shopping cart, 0 items"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5h2l1.7 10.2h10.9L20.5 8H6.2"></path><circle cx="9" cy="19" r="1"></circle><circle cx="17" cy="19" r="1"></circle></svg><span class="cart-count">0</span></button>');

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
        <button class="modal-add" type="button" id="modal-add-to-cart">Add to cart <span aria-hidden="true">+</span></button>
    </section>
</div>
<aside class="cart-drawer" id="cart-drawer" aria-label="Shopping cart" aria-hidden="true">
    <div class="cart-drawer-header"><div><p class="eyebrow">Your selection</p><h2>Your cart</h2></div><button class="modal-close" type="button" aria-label="Close shopping cart" data-close-cart>×</button></div>
    <div class="cart-items" id="cart-items"><p class="cart-empty">Your cart is empty.</p></div>
    <div class="cart-drawer-footer"><div><span>Subtotal</span><strong id="cart-subtotal">₦0</strong></div><button class="modal-add" type="button" id="checkout-button">Checkout <span aria-hidden="true">→</span></button></div>
</aside>
<div class="cart-backdrop" data-close-cart></div>`);

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
let selectedCard = null;

const getProductData = (card) => ({
    name: card.querySelector('h3').textContent,
    color: card.querySelector('.clothing-details p').textContent.split('·').pop().trim(),
    price: Number(card.querySelector('.clothing-details strong').textContent.replace(/[^0-9.]/g, '')),
    image: card.querySelector('.clothing-image').style.backgroundImage || getComputedStyle(card.querySelector('.clothing-image')).backgroundImage
});

const renderCart = () => {
    cartItemsElement.innerHTML = cartItems.length ? cartItems.map((item, index) => `<div class="cart-item"><div class="cart-item-image" style="background-image: ${item.image}"></div><div><h3>${item.name}</h3><p>${item.color} · Size ${item.size}</p></div><strong>${formatNaira(item.price)}</strong><button type="button" aria-label="Remove ${item.name}" data-remove-item="${index}">×</button></div>`).join('') : '<p class="cart-empty">Your cart is empty.</p>';
    cartCount.textContent = cartItems.length;
    cartSubtotal.textContent = formatNaira(cartItems.reduce((total, item) => total + item.price, 0));
    cartButton.setAttribute('aria-label', `Shopping cart, ${cartItems.length} items`);
};

const addToCart = (card, size = 'M') => {
    cartItems.push({ ...getProductData(card), size });
    renderCart();
};

const setCartOpen = (isOpen) => {
    cartDrawer.classList.toggle('open', isOpen);
    cartDrawer.setAttribute('aria-hidden', String(!isOpen));
    cartBackdrop.classList.toggle('open', isOpen);
    if (isOpen) document.body.classList.add('modal-open');
    else if (productModal.hidden) document.body.classList.remove('modal-open');
};

const openProductDetails = (card) => {
    selectedCard = card;
    const product = getProductData(card);
    document.querySelector('#product-modal-title').textContent = product.name;
    document.querySelector('#product-modal-color').textContent = product.color;
    document.querySelector('#product-modal-price').textContent = formatNaira(product.price);
    document.querySelector('#product-size').value = '';
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
        addToCart(button.closest('.clothing-card'));
        button.classList.add('added');
        button.innerHTML = 'Added to cart <span aria-hidden="true">✓</span>';
    });
});

document.querySelectorAll('[data-close-product]').forEach((control) => control.addEventListener('click', () => {
    productModal.hidden = true;
    if (!cartDrawer.classList.contains('open')) document.body.classList.remove('modal-open');
}));

document.querySelectorAll('[data-close-cart]').forEach((control) => control.addEventListener('click', () => setCartOpen(false)));
cartButton.addEventListener('click', () => setCartOpen(true));

cartItemsElement.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-remove-item]');
    if (!removeButton) return;
    cartItems.splice(Number(removeButton.dataset.removeItem), 1);
    renderCart();
});

document.querySelector('#modal-add-to-cart').addEventListener('click', () => {
    const size = document.querySelector('#product-size').value;
    if (!size || !selectedCard) {
        document.querySelector('#product-size').focus();
        return;
    }
    addToCart(selectedCard, size);
    document.querySelector('#modal-add-to-cart').textContent = 'Added to cart ✓';
});

document.querySelector('#checkout-button').addEventListener('click', () => {
    if (!cartItems.length) {
        window.alert('Your cart is empty. Add an item before checking out.');
        return;
    }
    const orderLines = cartItems.map((item, index) => `${index + 1}. ${item.name} | Color: ${item.color} | Size: ${item.size} | ${formatNaira(item.price)}`);
    const message = `Hello Basto Luxury & Wears, I would like to place this order:\n\n${orderLines.join('\n')}\n\nSubtotal: ${formatNaira(cartItems.reduce((total, item) => total + item.price, 0))}\n\nCustomer name:\nPhone number:\nDelivery address:\n\nThank you.`;
    window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
});
