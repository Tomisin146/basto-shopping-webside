(() => {
	const markImage = (el) => {
		if (el.dataset.img) return;
		const match = /url\(["']?(.*?)["']?\)/.exec(el.style.backgroundImage || '');
		if (!match) return;
		el.dataset.img = '1';
		const done = () => el.classList.add('is-loaded');
		const probe = new Image();
		probe.onload = probe.onerror = done;
		probe.src = match[1];
		if (probe.complete) done();
	};
	const scan = (root) => {
		if (root.nodeType !== 1) return;
		if (root.matches('.clothing-image')) markImage(root);
		root.querySelectorAll?.('.clothing-image').forEach(markImage);
	};
	scan(document.body);
	new MutationObserver((mutations) => mutations.forEach((m) => m.addedNodes.forEach(scan))).observe(document.body, { childList: true, subtree: true });
	const cartCount = document.querySelector('.cart-count');
	if (cartCount) {
		new MutationObserver(() => {
			cartCount.classList.remove('bump');
			void cartCount.offsetWidth;
			cartCount.classList.add('bump');
		}).observe(cartCount, { childList: true, characterData: true, subtree: true });
	}
})();
