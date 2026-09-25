const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.primary-navigation');
const cartCount = document.querySelector('.cart-count');
const cartButton = document.querySelector('.cart-button');
const productModal = document.querySelector('#product-modal');
const modalTitle = document.querySelector('#product-modal-title');
const modalColor = document.querySelector('#product-modal-color');
const modalPrice = document.querySelector('#product-modal-price');
const modalAddButton = document.querySelector('#modal-add-to-cart');
const cartDrawer = document.querySelector('#cart-drawer');
const cartItemsElement = document.querySelector('#cart-items');
const cartSubtotal = document.querySelector('#cart-subtotal');
const cartBackdrop = document.querySelector('.cart-backdrop');
const checkoutButton = document.querySelector('#checkout-button');
const cartItems = [];
const whatsappNumber = '2347072305794';
let selectedProduct = null;
const formatNaira = (amount) => `₦${amount.toLocaleString('en-NG')}`;
const convertToNaira = (amount) => 10000 + Math.min(Math.round(amount * 50), 10000);

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

const catalogSections = document.querySelector('#catalog-sections');
categoryCatalog.forEach((category) => {
	const section = document.createElement('section');
	section.className = 'clothing-section catalog-section';
	section.id = category.id;
	section.innerHTML = `<div class="section-heading"><div><h2>${category.title}</h2></div><span class="catalog-count">5 pieces</span></div><div class="clothing-grid">${category.products.map(([name, details, price, image]) => `<article class="clothing-card"><div class="clothing-image" style="background-image: url('${image}')"></div><div class="clothing-details"><div><h3>${name}</h3><p>${details}</p></div><strong>$${price}</strong></div><button class="add-to-cart" type="button" data-product="${name}">Add to cart <span aria-hidden="true">+</span></button></article>`).join('')}</div><a class="view-more-button" href="${category.id}.html">View more <span aria-hidden="true">→</span></a>`;
	catalogSections.appendChild(section);
});

document.querySelectorAll('.clothing-details strong, .product-card small').forEach((priceElement) => {
	const originalPrice = Number(priceElement.textContent.replace(/[^0-9.]/g, ''));
	if (originalPrice) priceElement.textContent = formatNaira(convertToNaira(originalPrice));
});
const getCardData = (card) => ({
	name: card.querySelector('h3').textContent,
	color: card.querySelector('.clothing-details p').textContent.split('·').pop().trim(),
	price: Number(card.querySelector('.clothing-details strong').textContent.replace(/[^0-9.]/g, '')),
	image: card.querySelector('.clothing-image').style.backgroundImage || getComputedStyle(card.querySelector('.clothing-image')).backgroundImage
});

const renderCart = () => {
	cartItemsElement.innerHTML = '';
	if (!cartItems.length) {
		cartItemsElement.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
	} else {
		cartItems.forEach((item, index) => {
			const itemElement = document.createElement('div');
			itemElement.className = 'cart-item';
			itemElement.innerHTML = `<div class="cart-item-image" style="background-image: ${item.image}"></div><div><h3>${item.name}</h3><p>${item.color} · Size ${item.size}</p></div><strong>${formatNaira(item.price)}</strong><button type="button" aria-label="Remove ${item.name}" data-remove-item="${index}">×</button>`;
			cartItemsElement.appendChild(itemElement);
		});
	}
	cartCount.textContent = cartItems.length;
	cartSubtotal.textContent = formatNaira(cartItems.reduce((total, item) => total + item.price, 0));
	cartButton.setAttribute('aria-label', `Shopping cart, ${cartItems.length} items`);
};

const addProductToCart = (card, size = 'M') => {
	cartItems.push({ ...getCardData(card), size });
	renderCart();
};

const setCartOpen = (isOpen) => {
	cartDrawer.classList.toggle('open', isOpen);
	cartDrawer.setAttribute('aria-hidden', String(!isOpen));
	cartBackdrop.classList.toggle('open', isOpen);
	if (isOpen) document.body.classList.add('modal-open');
	else if (productModal.hidden) document.body.classList.remove('modal-open');
};

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

document.querySelectorAll('.add-to-cart').forEach((button) => {
	button.addEventListener('click', () => {
		addProductToCart(button.closest('.clothing-card'));
		button.classList.add('added');
		button.innerHTML = 'Added to cart <span aria-hidden="true">✓</span>';
	});
});

document.querySelectorAll('.clothing-card').forEach((card) => {
	card.setAttribute('tabindex', '0');
	card.setAttribute('aria-label', `View details for ${card.querySelector('h3').textContent}`);

	const openProductDetails = () => {
		selectedProduct = card;
		modalTitle.textContent = card.querySelector('h3').textContent;
		modalColor.textContent = getCardData(card).color;
		modalPrice.textContent = card.querySelector('.clothing-details strong').textContent;
		modalAddButton.textContent = 'Add to cart +';
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
		productModal.hidden = true;
		document.body.classList.remove('modal-open');
	});
});

modalAddButton.addEventListener('click', () => {
	if (!selectedProduct) return;
	const selectedSize = document.querySelector('#product-size').value;
	if (!selectedSize) {
		document.querySelector('#product-size').focus();
		return;
	}
	const addButton = selectedProduct.querySelector('.add-to-cart');
	addProductToCart(selectedProduct, selectedSize);
	addButton.classList.add('added');
	addButton.innerHTML = 'Added to cart <span aria-hidden="true">✓</span>';
	modalAddButton.textContent = 'Added to cart ✓';
});

cartButton.addEventListener('click', () => setCartOpen(true));
document.querySelectorAll('[data-close-cart]').forEach((control) => control.addEventListener('click', () => setCartOpen(false)));
cartItemsElement.addEventListener('click', (event) => {
	const removeButton = event.target.closest('[data-remove-item]');
	if (!removeButton) return;
	cartItems.splice(Number(removeButton.dataset.removeItem), 1);
	renderCart();
});

checkoutButton.addEventListener('click', () => {
	if (!cartItems.length) {
		window.alert('Your cart is empty. Add an item before checking out.');
		return;
	}

	const orderLines = cartItems.map((item, index) => `${index + 1}. ${item.name} | Color: ${item.color} | Size: ${item.size} | ${formatNaira(item.price)}`);
	const message = `Hello Basto Luxury & Wears, I would like to place this order:\n\n${orderLines.join('\n')}\n\nSubtotal: ${formatNaira(cartItems.reduce((total, item) => total + item.price, 0))}\n\nCustomer name:\nPhone number:\nDelivery address:\n\nThank you.`;
	window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
});

const searchInput = document.querySelector('#site-search');
const searchableSections = document.querySelectorAll('.clothing-section');
searchInput.addEventListener('input', () => {
	const query = searchInput.value.trim().toLowerCase();
	searchableSections.forEach((section) => {
		const cards = section.querySelectorAll('.clothing-card');
		let visibleCards = 0;
		cards.forEach((card) => {
			const matches = !query || card.textContent.toLowerCase().includes(query) || section.querySelector('h2').textContent.toLowerCase().includes(query);
			card.hidden = !matches;
			if (matches) visibleCards += 1;
		});
		section.hidden = visibleCards === 0;
	});
});

document.querySelector('.search-bar').addEventListener('submit', (event) => event.preventDefault());
