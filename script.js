;(async () => {
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-navigation');
const cartCount = document.querySelector('.cart-count');
const cartButton = document.querySelector('.cart-button');
const productModal = document.querySelector('#product-modal');
const modalTitle = document.querySelector('#product-modal-title');
const modalColor = document.querySelector('#product-modal-color');
const modalPrice = document.querySelector('#product-modal-price');
const modalDescription = document.querySelector('.modal-description');
const productSize = document.querySelector('#product-size');
const productQuantity = document.querySelector('#product-quantity');
const productSizeLabel = document.querySelector('label[for="product-size"]');
const modalAddButton = document.querySelector('#modal-add-to-cart');
const cartDrawer = document.querySelector('#cart-drawer');
const cartItemsElement = document.querySelector('#cart-items');
const cartSubtotal = document.querySelector('#cart-subtotal');
const cartBackdrop = document.querySelector('.cart-backdrop');
const checkoutButton = document.querySelector('#checkout-button');
const checkoutModal = document.querySelector('#checkout-modal');
const checkoutForm = document.querySelector('#checkout-form');
const checkoutSummary = document.querySelector('#checkout-summary');
const checkoutStatus = document.querySelector('#checkout-status');
const placeOrderButton = document.querySelector('#place-order');
const checkoutPaymentMethod = document.querySelector('#checkout-payment-method');
const checkoutReceipt = document.querySelector('#checkout-receipt');
const paymentAccount = document.querySelector('#payment-account');
const searchInput = document.querySelector('#site-search');
const searchBar = document.querySelector('.search-bar');
const cartStorageKey = 'bastoCart';
let cartItems = [];

try {
	cartItems = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
} catch (error) {
	localStorage.removeItem(cartStorageKey);
}

const whatsappNumber = '2347072305794';
let selectedProduct = null;
const formatNaira = (amount) => `₦${Number(amount || 0).toLocaleString('en-NG')}`;
const getInventory = () => {
	try {
		const inventory = JSON.parse(localStorage.getItem(inventoryStorageKey) || '[]');
		return Array.isArray(inventory) ? inventory : [];
	} catch (error) {
		localStorage.removeItem(inventoryStorageKey);
		return [];
	}
};
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const safeImageUrl = (value) => String(value || '').replace(/["'()\\]/g, '');
let adminInventory = [];
let inventoryLoadFailed = false;
try {
	adminInventory = window.bastoInventoryApi?.configured
		? await window.bastoInventoryApi.listProducts()
		: getInventory();
} catch (error) {
	console.error('Could not load shared inventory.', error);
	inventoryLoadFailed = true;
}
const emptyCatalogMessage = inventoryLoadFailed
	? '<p class="catalog-empty">The catalog is temporarily unavailable. Please try again later.</p>'
	: '<p class="catalog-empty">No items available in this category yet.</p>';
const maxHomeProducts = 10;
document.querySelector('.new-arrivals .product-grid')?.replaceChildren();

const categoryCatalog = [
	{
		id: 'pants', title: 'Pants', products: [
			['Wide-leg trouser', 'Soft cotton · Black', 118, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=700&q=85'],
			['Panelled denim jean', 'Washed denim · Indigo', 124, 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=85'],
			['Pleated tailored pant', 'Wool blend · Charcoal', 132, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=85'],
			['Drawstring linen pant', 'Natural linen · Ecru', 108, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=700&q=85'],
			['Relaxed cargo trouser', 'Cotton canvas · Olive', 128, 'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=700&q=85']
		]
	},
	{
		id: 'shoes', title: 'Shoes', products: [
			['Minimal leather loafer', 'Polished leather · Black', 148, 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=700&q=85'],
			['Canvas low sneaker', 'Organic canvas · White', 96, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=700&q=85'],
			['Suede slide sandal', 'Soft suede · Tan', 84, 'https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=700&q=85'],
			['Sculpted ankle boot', 'Smooth leather · Brown', 176, 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=700&q=85'],
			['Everyday leather mule', 'Grain leather · Cream', 128, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=85']
		]
	},
	{
		id: 'watch-accessories', title: 'Watch & accessories', products: [
			['Classic face watch', 'Brushed steel · Gold', 188, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=85'],
			['Slim leather belt', 'Full-grain leather · Black', 58, 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=700&q=85'],
			['Everyday shoulder bag', 'Textured leather · Tan', 142, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=85'],
			['Sculptural sunglasses', 'Acetate frame · Tortoise', 76, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=85'],
			['Fine chain necklace', 'Gold vermeil · Gold', 64, 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=85']
		]
	},
	{
		id: 'cap', title: 'Cap', products: [
			['Six-panel cotton cap', 'Washed cotton · Black', 42, 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=85'],
			['Basto logo cap', 'Brushed twill · Gold', 46, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=700&q=85'],
			['Linen sun cap', 'Breathable linen · Sand', 38, 'https://images.unsplash.com/photo-1529958030586-3aae4ca485ff?auto=format&fit=crop&w=700&q=85'],
			['Corduroy five-panel', 'Fine corduroy · Olive', 44, 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?auto=format&fit=crop&w=700&q=85'],
			['Soft wool cap', 'Warm wool · Charcoal', 52, 'https://images.unsplash.com/photo-1572307480813-ceb0e59d8325?auto=format&fit=crop&w=700&q=85']
		]
	},
	{
		id: 'cosmetics', title: 'Cosmetics', products: [
			['Daily face oil', 'Botanical blend · Amber', 34, 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=700&q=85'],
			['Hydrating body cream', 'Shea butter · White', 28, 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=85'],
			['Soft tint balm', 'Nourishing tint · Rose', 22, 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=700&q=85'],
			['Cleansing clay mask', 'Mineral clay · Natural', 26, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=700&q=85'],
			['Hand and nail serum', 'Jojoba blend · Clear', 24, 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=700&q=85']
		]
	},
	{
		id: 'undies', title: 'Undies', products: [
			['Everyday rib brief', 'Organic cotton · Black', 24, 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=700&q=85'],
			['High-rise brief', 'Stretch jersey · White', 26, 'https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=700&q=85'],
			['Soft cotton boxer', 'Breathable cotton · Charcoal', 28, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=700&q=85'],
			['Seamless short', 'Second-skin stretch · Cocoa', 25, 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=700&q=85'],
			['Daily lounge brief', 'Modal blend · Olive', 27, 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=700&q=85']
		]
	}
];

const renderProductCard = (product) => {
	const remaining = Math.max(0, product.stock - product.sold);
	const available = product.available && remaining > 0;
	return `<article class="clothing-card" data-product-id="${escapeHtml(product.id || '')}" data-stock="${remaining}" data-description="${escapeHtml(product.description)}" data-sizes="${escapeHtml(product.sizes.join('|'))}" data-color="${escapeHtml(product.colors)}" data-available="${available}"><div class="clothing-image"${product.image ? ` style="background-image: url('${product.image}')"` : ''}>${available ? '' : '<span class="clothing-label sold-out-label">Sold out</span>'}</div><div class="clothing-details"><div><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.details)}</p><small class="stock-status">${available ? (remaining <= 2 ? `${remaining} pcs left` : `${remaining} pcs available`) : 'Sold out'}</small></div><strong>${formatNaira(product.price)}</strong></div><button class="add-to-cart${available ? '' : ' sold-out-button'}" type="button" data-product="${escapeHtml(product.name)}"${available ? '' : ' disabled'}>${available ? 'Add to cart <span aria-hidden="true">+</span>' : 'Sold out'}</button></article>`;
};

const catalogSections = document.querySelector('#catalog-sections');
if (catalogSections) {
	categoryCatalog.forEach((category) => {
		const adminProducts = adminInventory
			.filter((item) => item.category === category.id)
			.map((item) => ({
				id: item.id,
				name: item.name,
				details: `${item.description} · ${item.colors || 'Color not specified'}`,
				price: Number(item.price),
				image: safeImageUrl(item.image),
				available: item.available !== false,
				stock: Number(item.stock ?? 1),
				sold: Number(item.sold ?? 0),
				description: item.description,
				sizes: item.sizes || [],
				colors: item.colors || 'Color not specified'
			}));
		const section = document.createElement('section');
		section.className = 'clothing-section catalog-section';
		section.id = category.id;
		section.innerHTML = `<div class="section-heading"><div><h2>${category.title}</h2></div><span class="catalog-count">${adminProducts.length} pieces</span></div><div class="clothing-grid">${adminProducts.length ? adminProducts.slice(0, maxHomeProducts).map(renderProductCard).join('') : emptyCatalogMessage}</div>${adminProducts.length > maxHomeProducts ? `<a class="view-more-button" href="${category.id}.html">View more <span aria-hidden="true">→</span></a>` : ''}`;
		catalogSections.appendChild(section);
	});
}

const adminTops = adminInventory.filter((item) => item.category === 'tops').map((item) => ({
	id: item.id,
	name: item.name,
	details: `${item.description} · ${item.colors || 'Color not specified'}`,
	price: Number(item.price),
	image: safeImageUrl(item.image),
	available: item.available !== false,
	stock: Number(item.stock ?? 1),
	sold: Number(item.sold ?? 0),
	description: item.description,
	sizes: item.sizes || [],
	colors: item.colors || 'Color not specified'
}));

const topsSection = document.querySelector('#tops');
if (topsSection) {
	if (adminTops.length) {
		topsSection.querySelector('.clothing-grid')?.insertAdjacentHTML('beforeend', adminTops.slice(0, maxHomeProducts).map(renderProductCard).join(''));
		topsSection.querySelector('.catalog-count').textContent = `${adminTops.length} pieces`;
	} else {
		topsSection.querySelector('.clothing-grid').innerHTML = emptyCatalogMessage;
	}
	const topsViewMore = topsSection.querySelector('.view-more-button');
	if (topsViewMore) topsViewMore.hidden = adminTops.length <= maxHomeProducts;
}

const normalizeImageValue = (value) => String(value || '').replace(/^url\(["']?(.*?)['"]?\)$/, '$1');

const getCardData = (card) => ({
	productId: card.dataset.productId || '',
	name: card.querySelector('h3').textContent,
	color: card.querySelector('.clothing-details p').textContent.split('·').pop().trim(),
	price: Number(card.querySelector('.clothing-details strong').textContent.replace(/[^0-9.]/g, '')),
	image: normalizeImageValue(card.querySelector('.clothing-image').style.backgroundImage || getComputedStyle(card.querySelector('.clothing-image')).backgroundImage),
	stock: Number(card.dataset.stock || 1)
});

const renderCart = () => {
	if (!cartItemsElement || !cartCount || !cartSubtotal || !cartButton) return;
	localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
	cartItemsElement.innerHTML = '';
	if (!cartItems.length) {
		cartItemsElement.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
	} else {
		cartItems.forEach((item, index) => {
			const quantity = Number(item.quantity || 1);
			const productQuantity = cartItems
				.filter((cartItem) => cartItem.name === item.name)
				.reduce((total, cartItem) => total + Number(cartItem.quantity || 1), 0);
			const availableForItem = Number(item.stock || 1) - (productQuantity - quantity);
			const itemElement = document.createElement('div');
			itemElement.className = 'cart-item';
			itemElement.innerHTML = `<div class="cart-item-image"></div><div><h3>${item.name}</h3><p>${item.color} · Size ${item.size}</p><div class="cart-quantity"><button type="button" aria-label="Decrease ${item.name} quantity" data-change-quantity="-1" data-item-index="${index}">−</button><span>${quantity} pcs</span><button type="button" aria-label="Increase ${item.name} quantity" data-change-quantity="1" data-item-index="${index}"${quantity >= availableForItem ? ' disabled' : ''}>+</button></div></div><strong>${formatNaira(item.price * quantity)}</strong><button type="button" aria-label="Remove ${item.name}" data-remove-item="${index}">×</button>`;
			const imageUrl = normalizeImageValue(item.image);
			if (imageUrl) itemElement.querySelector('.cart-item-image').style.backgroundImage = `url("${imageUrl}")`;
			cartItemsElement.appendChild(itemElement);
		});
	}
	const totalQuantity = cartItems.reduce((total, item) => total + Number(item.quantity || 1), 0);
	cartCount.textContent = String(totalQuantity);
	cartSubtotal.textContent = formatNaira(cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0));
	cartButton.setAttribute('aria-label', `Shopping cart, ${totalQuantity} items`);
};

renderCart();

const clearCart = () => {
	cartItems = [];
	localStorage.removeItem(cartStorageKey);
	renderCart();
	if (cartDrawer && cartBackdrop) setCartOpen(false);
};

const addProductToCart = (card, size = 'M', quantity = 1) => {
	if (!card) return;
	const product = { ...getCardData(card), size, quantity };
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

if (menuToggle && navigation) {
	menuToggle.addEventListener('click', () => {
		const isOpen = navigation.classList.toggle('open');
		menuToggle.setAttribute('aria-expanded', String(isOpen));
	});

	navigation.querySelectorAll('a').forEach((link) => {
		link.addEventListener('click', () => {
			navigation.classList.remove('open');
			menuToggle.setAttribute('aria-expanded', 'false');
		});
	});
}

document.querySelectorAll('.add-to-cart').forEach((button) => {
	button.addEventListener('click', () => {
		const card = button.closest('.clothing-card');
		if (!card) return;
		if (Number(card.dataset.stock || 1) > 1) {
			card.click();
			return;
		}
		addProductToCart(card);
		button.classList.add('added');
		button.innerHTML = 'Added to cart <span aria-hidden="true">✓</span>';
	});
});

document.querySelectorAll('.clothing-card').forEach((card) => {
	card.setAttribute('tabindex', '0');
	card.setAttribute('aria-label', `View details for ${card.querySelector('h3').textContent}`);

	const openProductDetails = () => {
		if (!modalTitle || !modalColor || !modalPrice || !modalDescription || !productSize || !productQuantity || !modalAddButton || !productModal) return;
		selectedProduct = card;
		modalTitle.textContent = card.querySelector('h3').textContent;
		modalColor.textContent = card.dataset.color || getCardData(card).color;
		modalPrice.textContent = card.querySelector('.clothing-details strong').textContent;
		modalDescription.textContent = card.dataset.description || 'A considered Basto essential, designed for comfortable everyday wear and easy layering.';
		const sizes = card.hasAttribute('data-sizes') ? card.dataset.sizes.split('|').filter(Boolean) : ['XS', 'S', 'M', 'L', 'XL'];
		productSizeLabel.hidden = sizes.length === 0;
		productSize.hidden = sizes.length === 0;
		productSize.disabled = sizes.length <= 1;
		productSize.innerHTML = sizes.length === 1 ? `<option value="${sizes[0]}">${sizes[0]} available</option>` : '<option value="">Choose a size</option>';
		sizes.forEach((size) => {
			const option = document.createElement('option');
			option.value = size;
			option.textContent = size;
			productSize.appendChild(option);
		});
		const available = card.dataset.available !== 'false';
		productQuantity.max = String(card.dataset.stock || 1);
		const quantityInCart = cartItems
			.filter((item) => item.name === card.querySelector('h3').textContent)
			.reduce((total, item) => total + Number(item.quantity || 1), 0);
		productQuantity.max = String(Math.max(0, Number(card.dataset.stock || 1) - quantityInCart));
		productQuantity.value = '1';
		productQuantity.disabled = !available || Number(productQuantity.max) < 1;
		modalAddButton.disabled = !available || Number(productQuantity.max) < 1;
		modalAddButton.textContent = available && Number(productQuantity.max) > 0 ? 'Add to cart +' : 'Sold out';
		productModal.hidden = false;
		document.body.classList.add('modal-open');
	};

	card.addEventListener('click', (event) => {
		if (!event.target.closest('.add-to-cart')) openProductDetails();
	});
	card.addEventListener('keydown', (event) => {
		if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('.add-to-cart')) {
			event.preventDefault();
			openProductDetails();
		}
	});
});

document.querySelectorAll('[data-close-product]').forEach((control) => {
	control.addEventListener('click', () => {
		if (productModal) productModal.hidden = true;
		document.body.classList.remove('modal-open');
	});
});

if (modalAddButton) {
	modalAddButton.addEventListener('click', () => {
		if (!selectedProduct) return;
		if (selectedProduct.dataset.available === 'false') return;
		const selectedSize = productSize && !productSize.hidden ? productSize.value : '';
		const requestedQuantity = Number(productQuantity.value) || 1;
		const maximumQuantity = Number(productQuantity.max) || 1;
		if (requestedQuantity > maximumQuantity) {
			productQuantity.value = String(maximumQuantity);
			window.alert(`Only ${maximumQuantity} pcs left.`);
			return;
		}
		const quantity = Math.max(1, requestedQuantity);
		if (!productSize?.hidden && !selectedSize) {
			productSize?.focus();
			return;
		}
		const addButton = selectedProduct.querySelector('.add-to-cart');
		addProductToCart(selectedProduct, selectedSize || 'One size', quantity);
		if (addButton) {
			addButton.classList.add('added');
			addButton.innerHTML = 'Added to cart <span aria-hidden="true">✓</span>';
		}
		modalAddButton.textContent = 'Added to cart ✓';
	});
}

if (cartButton) cartButton.addEventListener('click', () => setCartOpen(true));
document.querySelectorAll('[data-close-cart]').forEach((control) => control.addEventListener('click', () => setCartOpen(false)));

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

if (checkoutButton) {
	checkoutButton.addEventListener('click', () => {
		if (!cartItems.length) {
			window.alert('Your cart is empty. Add an item before checking out.');
			return;
		}
		const subtotal = cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 1), 0);
		const itemCount = cartItems.reduce((total, item) => total + Number(item.quantity || 1), 0);
		checkoutSummary.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'} · ${formatNaira(subtotal)}`;
		checkoutStatus.textContent = '';
		setCartOpen(false);
		checkoutModal.hidden = false;
		document.body.classList.add('modal-open');
		document.querySelector('#checkout-name').focus();
	});
}

const renderPaymentAccount = () => {
	paymentAccount.textContent = checkoutPaymentMethod.value === 'OPay'
		? 'OPay\nAccount number: 7072305794\nAccount name: Babalola Oluwatosin'
		: 'Union Bank\nAccount number: 0221002585\nAccount name: Bato Luxury and Wears';
};
checkoutPaymentMethod.addEventListener('change', renderPaymentAccount);
renderPaymentAccount();

document.querySelectorAll('[data-close-checkout]').forEach((control) => control.addEventListener('click', () => {
	checkoutModal.hidden = true;
	document.body.classList.remove('modal-open');
}));

if (checkoutForm) {
	checkoutForm.addEventListener('submit', async (event) => {
		event.preventDefault();
		if (!cartItems.length) return;
		if (!window.bastoInventoryApi?.configured) {
			checkoutStatus.textContent = 'Order saving is not connected yet. Please contact us on WhatsApp to order.';
			return;
		}
		const receipt = checkoutReceipt.files[0];
		if (!receipt) {
			checkoutStatus.textContent = 'Upload your payment receipt to continue.';
			return;
		}
		if (receipt.size > 5 * 1024 * 1024) {
			checkoutStatus.textContent = 'Receipt must be 5 MB or smaller.';
			return;
		}
		placeOrderButton.disabled = true;
		checkoutStatus.textContent = 'Uploading receipt and saving your order...';
		const orderReference = `BST-${Date.now().toString(36).toUpperCase()}`;
		const customer = {
			name: document.querySelector('#checkout-name').value.trim(),
			phone: document.querySelector('#checkout-phone').value.trim(),
			address: document.querySelector('#checkout-address').value.trim()
		};
		const items = cartItems.map((item) => ({
			product_id: item.productId,
			name: item.name,
			color: item.color,
			size: item.size,
			quantity: Number(item.quantity || 1),
			unit_price: Number(item.price || 0),
			line_total: Number(item.price || 0) * Number(item.quantity || 1)
		}));
		const total = items.reduce((sum, item) => sum + item.line_total, 0);
		try {
			const receiptPath = await window.bastoInventoryApi.uploadPaymentReceipt(receipt, orderReference);
			await window.bastoInventoryApi.createOrder({
				id: orderReference,
				customer_name: customer.name,
				phone: customer.phone,
				address: customer.address,
				items,
				total,
				payment_method: checkoutPaymentMethod.value,
				receipt_path: receiptPath,
				status: 'New'
			});
			const orderLines = items.map((item, index) => `${index + 1}. ${item.name} | Color: ${item.color} | Size: ${item.size} | Qty: ${item.quantity} | ${formatNaira(item.line_total)}`);
			const message = `Hello Basto Luxury & Wears, I have placed order ${orderReference}.\n\n${orderLines.join('\n')}\n\nTotal: ${formatNaira(total)}\nPayment method: ${checkoutPaymentMethod.value}\nReceipt uploaded with the order.\n\nCustomer: ${customer.name}\nPhone: ${customer.phone}\nDelivery address: ${customer.address}\n\nPlease confirm payment and delivery. Thank you.`;
			sessionStorage.setItem('bastoCheckoutPending', 'true');
			clearCart();
			window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
		} catch (error) {
			checkoutStatus.textContent = error.message || 'Could not save your order. Please try again or contact us on WhatsApp.';
			placeOrderButton.disabled = false;
		}
	});
}

window.addEventListener('pageshow', () => {
	if (sessionStorage.getItem('bastoCheckoutPending') !== 'true') return;
	sessionStorage.removeItem('bastoCheckoutPending');
	clearCart();
});

if (searchInput) {
	const searchableSections = document.querySelectorAll('.clothing-section');
	searchInput.addEventListener('input', () => {
		const query = searchInput.value.trim().toLowerCase();
		searchableSections.forEach((section) => {
			const cards = section.querySelectorAll('.clothing-card');
			let visibleCards = 0;
			cards.forEach((card) => {
				const heading = section.querySelector('h2, h1')?.textContent?.toLowerCase() || '';
				const matches = !query || card.textContent.toLowerCase().includes(query) || heading.includes(query);
				card.hidden = !matches;
				if (matches) visibleCards += 1;
			});
			section.hidden = visibleCards === 0;
		});
	});
}

if (searchBar) {
	searchBar.addEventListener('submit', (event) => event.preventDefault());
}
})();
