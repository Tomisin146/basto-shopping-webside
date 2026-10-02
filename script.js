;(async () => {
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-navigation');
const cartCount = document.querySelector('.cart-count');
const cartButton = document.querySelector('.cart-button');
const productModal = document.querySelector('#product-modal');
const modalTitle = document.querySelector('#product-modal-title');
const modalPrice = document.querySelector('#product-modal-price');
const modalImage = document.querySelector('#product-modal-image');
const imageViewer = document.querySelector('#product-image-viewer');
const imageViewerImage = document.querySelector('#product-image-viewer-image');
const modalDescription = document.querySelector('.modal-description');
const productSize = document.querySelector('#product-size');
const productQuantity = document.querySelector('#product-quantity');
const productStockStatus = document.querySelector('#product-stock-status');
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
const checkoutFulfillment = document.querySelector('#checkout-fulfillment');
const checkoutPaymentInstruction = document.querySelector('#checkout-payment-instruction');
const checkoutAddressField = document.querySelector('#checkout-address-field');
const checkoutAddress = document.querySelector('#checkout-address');
const placeOrderButton = document.querySelector('#place-order');
const checkoutPaymentMethod = document.querySelector('#checkout-payment-method');
const checkoutReceipt = document.querySelector('#checkout-receipt');
const paymentAccount = document.querySelector('#payment-account');
const searchInput = document.querySelector('#site-search');
const searchBar = document.querySelector('.search-bar');
const cartStorageKey = 'bastoCart';
const inventoryStorageKey = 'bastoInventory';
let cartItems = [];

try {
	cartItems = JSON.parse(localStorage.getItem(cartStorageKey) || '[]');
} catch (error) {
	localStorage.removeItem(cartStorageKey);
}

const whatsappNumber = '2347072305794';
let selectedProduct = null;
const formatNaira = (amount) => `₦${Number(amount || 0).toLocaleString('en-NG')}`;
const skeletonCards = (count = 6) => '<article class="clothing-card skeleton-card" aria-hidden="true"><div class="clothing-image"></div><div class="clothing-details"><div><h3></h3><p></p></div></div></article>'.repeat(count);
const homeNewArrivalsGridLoading = document.querySelector('#home-new-arrivals .clothing-grid');
if (homeNewArrivalsGridLoading) homeNewArrivalsGridLoading.innerHTML = skeletonCards(4);
document.querySelector('#tops .clothing-grid')?.insertAdjacentHTML('beforeend', skeletonCards(6));
const topsCatalogCount = document.querySelector('#tops .catalog-count');
if (topsCatalogCount) topsCatalogCount.textContent = 'Loading...';
document.querySelector('#catalog-sections')?.insertAdjacentHTML('beforeend', `<div class="clothing-grid">${skeletonCards(6)}</div>`);
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
		: [];
	if (!window.bastoInventoryApi?.configured) inventoryLoadFailed = true;
} catch (error) {
	console.error('Could not load shared inventory.', error);
	inventoryLoadFailed = true;
}
const emptyCatalogMessage = inventoryLoadFailed
	? '<p class="catalog-empty">The catalog is temporarily unavailable. Please try again later.</p>'
	: '<p class="catalog-empty">No items available in this category yet.</p>';
const maxHomeProducts = 20;
const maxHomeTopsProducts = 15;
const shuffleProducts = (products) => {
	const shuffled = [...products];
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
	}
	return shuffled;
};
const storefrontSubcategories = {
	tops: ['Trending', 'Big Tops', 'Stretch Top', 'Small Polo'],
	pants: ['Baggy Jean', 'Stock Jean', 'Baggy Short Jean', 'Joggers Short', 'Joggers Long']
};
const availableProductCount = (products) => products.filter((product) => product.available !== false && Number(product.stock ?? 1) - Number(product.sold ?? 0) > 0).length;
const renderSubcategoryNavigation = (categoryId, title, products) => {
	const subcategories = storefrontSubcategories[categoryId];
	if (!subcategories) return '';
	return `<nav class="subcategory-navigation" aria-label="${title} subcategories"><button type="button" data-subcategory-filter="" aria-pressed="true">All</button>${subcategories.map((subcategory) => `<button type="button" data-subcategory-filter="${escapeHtml(subcategory)}" aria-pressed="false">${escapeHtml(subcategory)}</button>`).join('')}</nav>`;
};
const homeCategoryStates = new Map();
let bindProductCards = () => {};
const renderHomeCategory = (state, reset = false) => {
	if (reset) {
		state.renderedCount = 0;
		state.visibleCount = state.pageSize || maxHomeProducts;
		state.grid.replaceChildren();
	}
	const products = state.products
		.filter((product) => !state.activeSubcategory || product.subcategory === state.activeSubcategory)
		.sort((first, second) => {
			if (state.categoryId !== 'tops') return 0;
			const groupOrder = (product) => product.subcategory === 'Trending' ? 0 : product.subcategory === 'Big Tops' ? 2 : 1;
			return groupOrder(first) - groupOrder(second);
		});
	if (!products.length) {
		state.grid.innerHTML = emptyCatalogMessage;
		state.showMore.hidden = true;
		return;
	}
	const batch = products.slice(state.renderedCount, state.visibleCount);
	state.grid.insertAdjacentHTML('beforeend', batch.map((product, index) => {
		const groupOrder = (item) => item.subcategory === 'Trending' ? 0 : item.subcategory === 'Big Tops' ? 2 : 1;
		const currentGroup = groupOrder(product);
		const previousProduct = products[state.renderedCount + index - 1];
		const showGroupHeading = state.categoryId === 'tops'
			&& (!previousProduct || groupOrder(previousProduct) !== currentGroup);
		const heading = currentGroup === 0 ? 'TRENDING' : currentGroup === 2 ? 'BIG TOPS' : 'OTHER TOP ITEMS';
		return `${showGroupHeading ? `<h3 class="catalog-group-heading">${heading}</h3>` : ''}${renderProductCard(product)}`;
	}).join(''));
	state.renderedCount += batch.length;
	bindProductCards(state.grid);
	state.showMore.hidden = state.categoryId === 'tops' || state.renderedCount >= products.length;
	state.showMore.textContent = `Show More (${products.length - state.renderedCount})`;
};
document.querySelector('.new-arrivals .product-grid')?.replaceChildren();

const categoryCatalog = [
	{
		id: 'pants', title: 'Trousers', products: [
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
	return `<article class="clothing-card" data-product-id="${escapeHtml(product.id || '')}" data-stock="${remaining}" data-description="${escapeHtml(product.description)}" data-sizes="${escapeHtml(product.sizes.join('|'))}" data-subcategory="${escapeHtml(product.subcategory || '')}" data-image="${escapeHtml(product.image || '')}" data-available="${available}"><div class="clothing-image"${product.image ? ` style="background-image: url('${product.image}')"` : ''}>${available ? '' : '<span class="clothing-label sold-out-label">Sold out</span>'}</div><div class="clothing-details"><div><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.details)}</p><small class="stock-status">${available ? (remaining <= 2 ? `${remaining} pcs left` : `${remaining} pcs available`) : 'Sold out'}</small></div><strong>${formatNaira(product.price)}</strong></div><button class="add-to-cart${available ? '' : ' sold-out-button'}" type="button" data-product="${escapeHtml(product.name)}"${available ? '' : ' disabled'}>${available ? 'Add to cart <span aria-hidden="true">+</span>' : 'Sold out'}</button></article>`;
};

const supportedSizesFor = (item) => {
	const supportedSizes = item.category === 'pants'
		? ['XL', '2XL', '3XL', '47', '48', '49', '50']
		: item.category === 'shoes'
			? Array.from({ length: 11 }, (_, index) => String(36 + index))
		: ['cosmetics', 'watch-accessories'].includes(item.category) ? [] : ['L', 'XL', '2XL', '3XL'];
	return (item.sizes || []).map(String).filter((size) => supportedSizes.includes(size));
};

const homeNewArrivalsSection = document.querySelector('#home-new-arrivals');
if (homeNewArrivalsSection) {
	const newestProducts = adminInventory.filter((item) => item.is_new_arrival === true).map((item) => ({
		id: item.id,
		name: item.name,
		category: item.category,
		details: item.description,
		price: Number(item.price),
		image: safeImageUrl(item.image),
		available: item.available !== false,
		stock: Number(item.stock ?? 1),
		sold: Number(item.sold ?? 0),
		description: item.description,
		subcategory: item.subcategory || '',
		sizes: supportedSizesFor(item)
	}));
	const newArrivalsGrid = homeNewArrivalsSection.querySelector('.clothing-grid');
	newArrivalsGrid.innerHTML = newestProducts.length
		? newestProducts.map(renderProductCard).join('')
		: emptyCatalogMessage;
	bindProductCards(newArrivalsGrid);
}

const catalogSections = document.querySelector('#catalog-sections');
if (catalogSections) {
	catalogSections.replaceChildren();
	categoryCatalog.forEach((category) => {
		let adminProducts = adminInventory
			.filter((item) => item.category === category.id)
			.map((item) => ({
				id: item.id,
				name: item.name,
				details: item.description,
				price: Number(item.price),
				image: safeImageUrl(item.image),
				available: item.available !== false,
				stock: Number(item.stock ?? 1),
				sold: Number(item.sold ?? 0),
				description: item.description,
				subcategory: item.subcategory || '',
				sizes: supportedSizesFor(item),
			}));
		const section = document.createElement('section');
		section.className = 'clothing-section catalog-section';
		section.id = category.id;
		section.innerHTML = `<div class="section-heading"><div><h2>${category.title}</h2></div><span class="catalog-count">${availableProductCount(adminProducts)} available</span></div>${renderSubcategoryNavigation(category.id, category.title, adminProducts)}<div class="clothing-grid"></div><button class="catalog-show-more" type="button" hidden>Show More</button>${adminProducts.length > maxHomeProducts ? `<a class="view-more-button" href="${category.id}.html">View more <span aria-hidden="true">→</span></a>` : ''}`;
		catalogSections.appendChild(section);
		const state = {
			categoryId: category.id,
			products: adminProducts,
			grid: section.querySelector('.clothing-grid'),
			showMore: section.querySelector('.catalog-show-more'),
			activeSubcategory: '',
			renderedCount: 0,
			visibleCount: maxHomeProducts
		};
		homeCategoryStates.set(category.id, state);
		renderHomeCategory(state, true);
	});
}

const adminTops = adminInventory.filter((item) => item.category === 'tops').map((item) => ({
	id: item.id,
	name: item.name,
	details: item.description,
	price: Number(item.price),
	image: safeImageUrl(item.image),
	available: item.available !== false,
	stock: Number(item.stock ?? 1),
	sold: Number(item.sold ?? 0),
	description: item.description,
	subcategory: item.subcategory || '',
	sizes: supportedSizesFor(item),
}));

const topsSection = document.querySelector('#tops');
if (topsSection) {
	const grid = topsSection.querySelector('.clothing-grid');
	grid.replaceChildren();
	topsSection.querySelector('.catalog-count').textContent = `${availableProductCount(adminTops)} available`;
	topsSection.querySelector('.section-heading').insertAdjacentHTML('afterend', renderSubcategoryNavigation('tops', 'Tops', adminTops));
	const showMore = document.createElement('button');
	showMore.type = 'button';
	showMore.className = 'catalog-show-more';
	showMore.hidden = true;
	showMore.textContent = 'Show More';
	grid.after(showMore);
	const state = { categoryId: 'tops', products: adminTops, grid, showMore, activeSubcategory: '', renderedCount: 0, pageSize: maxHomeTopsProducts, visibleCount: maxHomeTopsProducts };
	homeCategoryStates.set('tops', state);
	renderHomeCategory(state, true);
	const topsViewMore = topsSection.querySelector('.view-more-button');
	if (topsViewMore) topsViewMore.hidden = adminTops.length <= maxHomeTopsProducts;
}

const normalizeImageValue = (value) => String(value || '').replace(/^url\(["']?(.*?)['"]?\)$/, '$1');

const getCardData = (card) => ({
	productId: card.dataset.productId || '',
	name: card.querySelector('h3').textContent,
	price: Number(card.querySelector('.clothing-details strong').textContent.replace(/[^0-9.]/g, '')),
	image: card.dataset.image || normalizeImageValue(card.querySelector('.clothing-image').style.backgroundImage || getComputedStyle(card.querySelector('.clothing-image')).backgroundImage),
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
			const productStock = Number(item.stock ?? 1);
			const productQuantity = cartItems
				.filter((cartItem) => item.productId ? cartItem.productId === item.productId : cartItem.name === item.name)
				.reduce((total, cartItem) => total + Number(cartItem.quantity || 1), 0);
			const availableForItem = productStock - (productQuantity - quantity);
			const stockMessage = item.available === false || productStock <= 0
				? '<small class="stock-status cart-stock-status">Sold out</small>'
				: productQuantity > productStock
					? `<small class="stock-status cart-stock-status">Only ${productStock} pcs available</small>`
					: '';
			const itemElement = document.createElement('div');
			itemElement.className = 'cart-item';
			itemElement.innerHTML = `<div class="cart-item-image"></div><div><h3>${item.name}</h3><p>Size ${item.size}</p>${stockMessage}<div class="cart-quantity"><button type="button" aria-label="Decrease ${item.name} quantity" data-change-quantity="-1" data-item-index="${index}">−</button><span>${quantity} pcs</span><button type="button" aria-label="Increase ${item.name} quantity" data-change-quantity="1" data-item-index="${index}"${quantity >= availableForItem ? ' disabled' : ''}>+</button></div></div><strong>${formatNaira(item.price * quantity)}</strong><button type="button" aria-label="Remove ${item.name}" data-remove-item="${index}">×</button>`;
			const imageUrl = normalizeImageValue(item.image);
			const cartImage = itemElement.querySelector('.cart-item-image');
			cartImage.dataset.image = imageUrl;
			if (imageUrl) cartImage.style.backgroundImage = `url("${imageUrl}")`;
			cartItemsElement.appendChild(itemElement);
		});
	}
	cartItemsElement.querySelectorAll('.cart-item-image').forEach((image) => {
		image.setAttribute('role', 'button');
		image.tabIndex = 0;
		image.setAttribute('aria-label', `View larger image of ${image.closest('.cart-item')?.querySelector('h3')?.textContent || 'product'}`);
	});
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

const updateProductStockStatus = (card, showSelection = false) => {
	const name = card.querySelector('h3').textContent;
	const quantityInCart = cartItems
		.filter((item) => item.name === name)
		.reduce((total, item) => total + Number(item.quantity || 1), 0);
	const availableStock = Math.max(0, Number(card.dataset.stock || 0) - quantityInCart);
	const available = card.dataset.available !== 'false' && availableStock > 0;
	productStockStatus.hidden = !available;
	const selectedQuantity = Number(productQuantity.value) || 1;
	productStockStatus.textContent = available
		? `${availableStock} ${availableStock === 1 ? 'piece' : 'pieces'} left${showSelection && selectedQuantity > 1 ? ` (${selectedQuantity} selected)` : ''}`
		: '';
	return availableStock;
};
productQuantity.addEventListener('input', () => {
	if (selectedProduct) updateProductStockStatus(selectedProduct, true);
});

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
		menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
	});

	navigation.querySelectorAll('a').forEach((link) => {
		link.addEventListener('click', () => {
			navigation.classList.remove('open');
			menuToggle.setAttribute('aria-expanded', 'false');
			menuToggle.setAttribute('aria-label', 'Open menu');
		});
	});
}

const wireProductCard = (card) => {
	if (card.dataset.interactionsBound) return;
	card.dataset.interactionsBound = 'true';
	const button = card.querySelector('.add-to-cart');
	button?.addEventListener('click', () => {
		const sizes = card.hasAttribute('data-sizes') ? card.dataset.sizes.split('|').filter(Boolean) : ['L', 'XL', '2XL', '3XL'];
		if (Number(card.dataset.stock || 1) > 1 || sizes.length) {
			card.click();
			return;
		}
		addProductToCart(card, 'One size');
		button.classList.add('added');
		button.innerHTML = 'Added to cart <span aria-hidden="true">✓</span>';
	});
	const openProductDetails = () => {
		if (!modalTitle || !modalPrice || !modalImage || !modalDescription || !productSize || !productQuantity || !modalAddButton || !productModal) return;
		selectedProduct = card;
		modalTitle.textContent = card.querySelector('h3').textContent;
		const imageSource = getCardData(card).image;
		modalImage.hidden = !imageSource;
		modalImage.removeAttribute('src');
		if (imageSource) {
			modalImage.alt = `${modalTitle.textContent} product image`;
			modalImage.src = imageSource;
		}
		modalPrice.textContent = card.querySelector('.clothing-details strong').textContent;
		modalDescription.textContent = card.dataset.description || 'A considered Basto essential, designed for comfortable everyday wear and easy layering.';
		const sizes = card.hasAttribute('data-sizes') ? card.dataset.sizes.split('|').filter(Boolean) : ['L', 'XL', '2XL', '3XL'];
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
		const availableStock = Math.max(0, Number(card.dataset.stock || 0) - cartItems
			.filter((item) => item.name === card.querySelector('h3').textContent)
			.reduce((total, item) => total + Number(item.quantity || 1), 0));
		productQuantity.max = String(availableStock);
		productQuantity.value = '1';
		updateProductStockStatus(card);
		productQuantity.disabled = !available || Number(productQuantity.max) < 1;
		modalAddButton.disabled = !available || Number(productQuantity.max) < 1;
		modalAddButton.textContent = available && Number(productQuantity.max) > 0 ? 'Add to cart +' : 'Sold out';
		productModal.hidden = false;
		document.body.classList.add('modal-open');
	};

	card.addEventListener('click', (event) => {
		if (!event.target.closest('.add-to-cart, .clothing-image')) openProductDetails();
	});
	card.addEventListener('keydown', (event) => {
		if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('.add-to-cart')) {
			event.preventDefault();
			openProductDetails();
		}
	});
};
bindProductCards = (container = document) => {
	if (container.matches?.('.clothing-card')) wireProductCard(container);
	container.querySelectorAll('.clothing-card').forEach(wireProductCard);
};
bindProductCards();

const closeImageViewer = () => {
	imageViewer.hidden = true;
	if ((!productModal || productModal.hidden) && (!cartDrawer || !cartDrawer.classList.contains('open'))) {
		document.body.classList.remove('modal-open');
	}
};
const openImageViewer = (imageSource, productName) => {
	if (!imageSource) return;
	imageViewerImage.src = imageSource;
	imageViewerImage.alt = `${productName || 'Product'} image`;
	imageViewer.hidden = false;
	document.body.classList.add('modal-open');
};
document.addEventListener('click', (event) => {
	const previewImage = event.target.closest('.modal-product-image');
	if (previewImage) {
		const productName = previewImage.closest('.product-modal-panel')?.querySelector('h2')?.textContent;
		openImageViewer(previewImage.currentSrc || previewImage.src, productName);
		return;
	}
	const imageTarget = event.target.closest('.clothing-image, .cart-item-image');
	if (imageTarget) {
		if (imageTarget.closest('.search-results-grid')) return;
		const card = imageTarget.closest('.clothing-card');
		const cartItem = imageTarget.closest('.cart-item');
		const imageSource = card
			? getCardData(card).image
			: normalizeImageValue(imageTarget.dataset.image || getComputedStyle(imageTarget).backgroundImage);
		openImageViewer(imageSource, card?.querySelector('h3')?.textContent || cartItem?.querySelector('h3')?.textContent);
		return;
	}
	if (event.target === imageViewer || event.target.closest('[data-close-image-viewer]')) closeImageViewer();
});
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !imageViewer.hidden) closeImageViewer();
	if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.cart-item-image')) {
		event.preventDefault();
		const cartItem = event.target.closest('.cart-item');
		openImageViewer(normalizeImageValue(event.target.dataset.image || getComputedStyle(event.target).backgroundImage), cartItem?.querySelector('h3')?.textContent);
	}
});

document.addEventListener('click', (event) => {
	const filterButton = event.target.closest('[data-subcategory-filter]');
	if (filterButton) {
		const section = filterButton.closest('.clothing-section');
		const state = section && homeCategoryStates.get(section.id);
		if (state) {
			state.activeSubcategory = filterButton.dataset.subcategoryFilter || '';
			section.querySelectorAll('[data-subcategory-filter]').forEach((button) => {
				button.setAttribute('aria-pressed', String(button === filterButton));
			});
			renderHomeCategory(state, true);
		}
	}
	const showMoreButton = event.target.closest('.catalog-show-more');
	if (!showMoreButton) return;
	const section = showMoreButton.closest('.clothing-section');
	const state = section && homeCategoryStates.get(section.id);
	if (!state) return;
	state.visibleCount += maxHomeProducts;
	renderHomeCategory(state);
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
		updateProductStockStatus(selectedProduct);
		if (addButton) {
			addButton.classList.add('added');
			addButton.innerHTML = 'Added to cart <span aria-hidden="true">✓</span>';
		}
		modalAddButton.textContent = 'Added to cart ✓';
	});
}

if (cartButton) cartButton.addEventListener('click', () => {
	setCartOpen(true);
	refreshCartStock().catch((error) => console.error('Could not refresh cart stock.', error));
});
window.setInterval(() => {
	if (cartDrawer?.classList.contains('open')) {
		refreshCartStock().catch((error) => console.error('Could not refresh cart stock.', error));
	}
}, 5000);
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
	checkoutButton.addEventListener('click', async () => {
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
const deliveryPaymentInstruction = 'Please pay the total amount shown above and send your payment receipt to BASTO on WhatsApp. BASTO will arrange your delivery after payment confirmation.';
const pickupPaymentInstruction = 'Please pay the total amount shown above and send your payment receipt to BASTO on WhatsApp. BASTO will confirm your pickup after payment confirmation. No delivery will be arranged for this order.';
const updateCheckoutFulfillment = () => {
	const isPickup = checkoutFulfillment.value === 'pickup';
	checkoutAddressField.hidden = isPickup;
	checkoutAddress.disabled = isPickup;
	checkoutAddress.required = !isPickup;
	if (isPickup) checkoutAddress.value = '';
	checkoutPaymentInstruction.textContent = isPickup ? pickupPaymentInstruction : deliveryPaymentInstruction;
};
checkoutFulfillment.addEventListener('change', updateCheckoutFulfillment);
updateCheckoutFulfillment();
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
		const isPickup = checkoutFulfillment.value === 'pickup';
		const customer = {
			name: document.querySelector('#checkout-name').value.trim(),
			phone: document.querySelector('#checkout-phone').value.trim(),
			address: isPickup ? 'PICKUP - CUSTOMER WILL COLLECT; NO DELIVERY REQUIRED' : checkoutAddress.value.trim()
		};
		const items = cartItems.map((item) => ({
			product_id: item.productId,
			name: item.name,
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
			const orderLines = items.map((item, index) => `${index + 1}. ${item.name} | Size: ${item.size} | Qty: ${item.quantity} | ${formatNaira(item.line_total)}`);
			const orderType = isPickup ? 'PICKUP ORDER' : 'DELIVERY ORDER';
			const fulfillmentDetails = isPickup
				? 'The customer will come to BASTO for pickup. BASTO must NOT arrange delivery.'
				: `Delivery address: ${customer.address}`;
			const message = `Hello Basto Luxury & Wears, I have placed order ${orderReference}.\n\n${orderType}\n\n${orderLines.join('\n')}\n\nTotal: ${formatNaira(total)}\nPayment method: ${checkoutPaymentMethod.value}\nReceipt uploaded with the order.\n\n${checkoutPaymentInstruction.textContent}\n\nCustomer: ${customer.name}\nPhone: ${customer.phone}\n${fulfillmentDetails}\n\nPlease confirm payment. Thank you.`;
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
	window.location.replace('index.html');
});

if (searchInput) {
	const storefrontMain = document.querySelector('#home');
	const searchResultsSection = document.createElement('section');
	searchResultsSection.className = 'clothing-section search-results-section';
	searchResultsSection.hidden = true;
	searchResultsSection.innerHTML = '<div class="section-heading"><div><p class="eyebrow">Search</p><h2>Results</h2></div><span class="catalog-count"></span></div><div class="clothing-grid search-results-grid"></div>';
	storefrontMain.querySelector('.hero').after(searchResultsSection);
	const searchResultsGrid = searchResultsSection.querySelector('.search-results-grid');
	const normalMainVisibility = new Map([...storefrontMain.children].filter((child) => child !== searchResultsSection && child.matches('.hero, section, #catalog-sections')).map((child) => [child, child.hidden]));
	const categoryLabels = { pants: 'trousers pants', 'watch-accessories': 'watch accessories', tops: 'tops', shoes: 'shoes', cap: 'cap caps', cosmetics: 'cosmetics', undies: 'undies' };
	const searchableProducts = adminInventory.map((item) => ({
		id: item.id,
		name: item.name,
		category: item.category,
		details: item.description,
		price: Number(item.price),
		image: safeImageUrl(item.image),
		available: item.available !== false,
		stock: Number(item.stock ?? 1),
		sold: Number(item.sold ?? 0),
		description: item.description,
		subcategory: item.subcategory || '',
		sizes: supportedSizesFor(item),
		searchText: `${item.name} ${item.description || ''} ${item.category} ${categoryLabels[item.category] || ''} ${item.subcategory || ''}`.toLowerCase()
	}));
	const runSearch = () => {
		const query = searchInput.value.trim().toLowerCase();
		if (!query) {
			searchResultsSection.hidden = true;
			normalMainVisibility.forEach((wasHidden, element) => { element.hidden = wasHidden; });
			return;
		}
		normalMainVisibility.forEach((wasHidden, element) => { element.hidden = true; });
		searchResultsSection.hidden = false;
		const terms = query.split(/\s+/);
		const matches = searchableProducts.filter((product) => terms.every((term) => product.searchText.includes(term)));
		searchResultsSection.querySelector('h2').textContent = `Results for “${searchInput.value.trim()}”`;
		searchResultsGrid.replaceChildren();
		if (!matches.length) {
			searchResultsGrid.innerHTML = '<p class="catalog-empty" role="status">No products found</p>';
			return;
		}
		searchResultsGrid.insertAdjacentHTML('beforeend', matches.map(renderProductCard).join(''));
		bindProductCards(searchResultsGrid);
	};
	searchInput.addEventListener('input', runSearch);
	if (searchInput.value.trim()) runSearch();
}

if (searchBar) {
	searchBar.addEventListener('submit', (event) => event.preventDefault());
}
})();
