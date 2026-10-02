// Generates a BASTO PDF receipt for a saved order and sends it to the owner's WhatsApp
// through the WhatsApp Business Cloud API.
//
// Secrets (wrangler secret put): WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, SUPABASE_SERVICE_ROLE_KEY.
// One-time Supabase SQL (marks an order as sent so it is never sent twice):
//   alter table public.orders add column if not exists whatsapp_receipt_sent_at timestamptz;

const GRAPH = 'https://graph.facebook.com/v21.0';
const GOLD = [0.788, 0.635, 0.302];
const BLACK = [0, 0, 0];
const GREY = [0.4, 0.4, 0.4];
const MAX_ORDER_AGE_MS = 30 * 60 * 1000;

const naira = (value) => `NGN ${Math.round(Number(value) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
const ascii = (value) => String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7e]/g, '');
const pdfEscape = (value) => ascii(value).replace(/[\\()]/g, '\\$&');

const textWidth = (text, size, bold) => {
	let units = 0;
	for (const character of ascii(text)) {
		if (/\d/.test(character)) units += 0.556;
		else if (',.: '.includes(character)) units += 0.278;
		else if (/[A-Z]/.test(character)) units += 0.68;
		else units += 0.52;
	}
	return units * size * (bold ? 1.05 : 1);
};

const wrapText = (text, size, maxWidth) => {
	const lines = [];
	let line = '';
	for (const word of ascii(text).split(/\s+/).filter(Boolean)) {
		const next = line ? `${line} ${word}` : word;
		if (line && textWidth(next, size) > maxWidth) {
			lines.push(line);
			line = word;
		} else line = next;
	}
	if (line) lines.push(line);
	return lines.length ? lines : [''];
};

const buildReceiptPdf = (order) => {
	const W = 595;
	const H = 842;
	const M = 48;
	const pages = [];
	let ops;
	let y;
	const color = (c, stroke) => `${c.join(' ')} ${stroke ? 'RG' : 'rg'}\n`;
	const rect = (x, top, w, h, c) => { ops.push(`${color(c)}${x} ${H - top - h} ${w} ${h} re f\n`); };
	const text = (x, top, value, { size = 10, bold = false, c = BLACK, align = 'left' } = {}) => {
		const left = align === 'right' ? x - textWidth(value, size, bold) : x;
		ops.push(`BT ${color(c)}/${bold ? 'F2' : 'F1'} ${size} Tf ${left.toFixed(2)} ${H - top} Td (${pdfEscape(value)}) Tj ET\n`);
	};
	const newPage = (continued) => {
		ops = [];
		pages.push(ops);
		rect(0, 0, W, 96, BLACK);
		rect(0, 96, W, 4, GOLD);
		text(M, 56, 'BASTO', { size: 30, bold: true, c: [1, 1, 1] });
		text(M, 76, 'LUXURY & WEARS', { size: 9, c: GOLD });
		text(W - M, 56, continued ? 'ORDER RECEIPT (cont.)' : 'ORDER RECEIPT', { size: 13, bold: true, c: GOLD, align: 'right' });
		text(W - M, 76, order.id, { size: 10, c: [1, 1, 1], align: 'right' });
		y = 128;
	};
	const rule = (c = GOLD) => { rect(M, y, W - 2 * M, 0.8, c); };

	const created = new Date(order.created_at);
	const when = Number.isNaN(created.getTime()) ? '' : created.toLocaleString('en-GB', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' });
	const isPickup = /^PICKUP/i.test(order.address || '');
	const items = Array.isArray(order.items) ? order.items : [];
	const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.line_total) || Number(item.unit_price) * Number(item.quantity) || 0), 0);
	const total = Number(order.total) || itemsSubtotal;
	const hasDeliveryFee = order.delivery_fee !== undefined && order.delivery_fee !== null;
	const paymentStatus = order.status === 'Paid' || order.status === 'Completed' || order.status === 'Shipped' || order.status === 'Confirmed'
		? 'Payment confirmed'
		: order.status === 'Cancelled' ? 'Cancelled' : 'Awaiting confirmation (payment proof uploaded)';

	newPage(false);
	text(M, y, 'ORDER DETAILS', { size: 9, bold: true, c: GOLD });
	y += 18;
	const detail = (label, value) => {
		text(M, y, label, { size: 9, c: GREY });
		text(M + 120, y, value, { size: 10 });
		y += 16;
	};
	detail('Order number', order.id);
	detail('Date & time', when);
	detail('Payment method', order.payment_method || '-');
	detail('Payment status', paymentStatus);
	detail('Fulfilment', isPickup ? 'Pickup' : 'Delivery');
	y += 8;
	rule();
	y += 22;

	text(M, y, 'CUSTOMER', { size: 9, bold: true, c: GOLD });
	y += 18;
	detail('Name', order.customer_name || '-');
	detail('Phone', order.phone || '-');
	text(M, y, isPickup ? 'Pickup' : 'Delivery address', { size: 9, c: GREY });
	const addressLines = isPickup ? ['Customer will collect - no delivery required'] : wrapText(order.address || '-', 10, W - 2 * M - 120);
	addressLines.forEach((line) => { text(M + 120, y, line, { size: 10 }); y += 14; });
	y += 10;

	const cols = { no: M + 8, name: M + 30, size: 330, qty: 385, price: 470, amount: W - M - 8 };
	const header = () => {
		rect(M, y - 14, W - 2 * M, 24, BLACK);
		text(cols.no, y + 2, '#', { size: 9, bold: true, c: GOLD });
		text(cols.name, y + 2, 'ITEM', { size: 9, bold: true, c: GOLD });
		text(cols.size, y + 2, 'SIZE', { size: 9, bold: true, c: GOLD });
		text(cols.qty, y + 2, 'QTY', { size: 9, bold: true, c: GOLD });
		text(cols.price, y + 2, 'PRICE', { size: 9, bold: true, c: GOLD, align: 'right' });
		text(cols.amount, y + 2, 'AMOUNT', { size: 9, bold: true, c: GOLD, align: 'right' });
		y += 28;
	};
	header();
	items.forEach((item, index) => {
		const nameLines = wrapText(item.name, 10, cols.size - cols.name - 10);
		const rowHeight = Math.max(1, nameLines.length) * 13 + 10;
		if (y + rowHeight > H - 190) { newPage(true); header(); }
		text(cols.no, y, String(index + 1), { size: 10, c: GREY });
		nameLines.forEach((line, lineIndex) => text(cols.name, y + lineIndex * 13, line, { size: 10 }));
		text(cols.size, y, item.size || '-', { size: 10 });
		text(cols.qty, y, String(item.quantity), { size: 10 });
		text(cols.price, y, naira(item.unit_price), { size: 10, align: 'right' });
		text(cols.amount, y, naira(item.line_total), { size: 10, bold: true, align: 'right' });
		y += rowHeight;
		rect(M, y - 8, W - 2 * M, 0.5, [0.85, 0.85, 0.85]);
	});

	if (y > H - 170) newPage(true);
	y += 10;
	const sum = (label, value, strong) => {
		text(380, y, label, { size: strong ? 12 : 10, bold: strong, c: strong ? BLACK : GREY });
		text(W - M - 8, y, value, { size: strong ? 13 : 10, bold: strong, align: 'right' });
		y += strong ? 22 : 17;
	};
	sum('Subtotal', naira(itemsSubtotal));
	sum('Delivery fee', hasDeliveryFee ? naira(order.delivery_fee) : 'Not charged');
	rect(380, y - 8, W - M - 380, 1.2, GOLD);
	y += 6;
	sum('TOTAL', naira(total), true);

	y = H - 70;
	rect(M, y - 14, W - 2 * M, 0.8, GOLD);
	text(W / 2, y + 6, 'Thank you for shopping with BASTO.', { size: 10, bold: true, align: 'right', c: BLACK });
	text(M, y + 6, 'BASTO Luxury & Wears', { size: 9, c: GREY });
	text(M, y + 20, 'Ijemo Alape, Abeokuta, Ogun State, Nigeria', { size: 8, c: GREY });

	const objects = [];
	const add = (body) => { objects.push(body); return objects.length; };
	add('<< /Type /Catalog /Pages 2 0 R >>');
	add('PAGES');
	add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
	add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
	const pageIds = pages.map((pageOps) => {
		const stream = pageOps.join('');
		const contentId = add(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
		return add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
	});
	objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

	let pdf = '%PDF-1.4\n';
	const offsets = objects.map((body, index) => {
		const offset = pdf.length;
		pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
		return offset;
	});
	const xref = pdf.length;
	pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}`;
	pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
	return new TextEncoder().encode(pdf);
};

const supabase = (env, path, init = {}) => fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
	...init,
	headers: {
		apikey: env.SUPABASE_SERVICE_ROLE_KEY,
		Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
		'Content-Type': 'application/json',
		...init.headers
	}
});

const sendReceipt = async (env, order, pdf) => {
	const form = new FormData();
	form.append('messaging_product', 'whatsapp');
	form.append('type', 'application/pdf');
	form.append('file', new Blob([pdf], { type: 'application/pdf' }), `BASTO-Receipt-${order.id}.pdf`);
	const upload = await fetch(`${GRAPH}/${env.WHATSAPP_PHONE_NUMBER_ID}/media`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}` },
		body: form
	});
	const media = await upload.json();
	if (!upload.ok || !media.id) throw new Error(`Media upload failed: ${JSON.stringify(media)}`);
	const send = await fetch(`${GRAPH}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			messaging_product: 'whatsapp',
			to: env.OWNER_WHATSAPP,
			type: 'document',
			document: {
				id: media.id,
				filename: `BASTO-Receipt-${order.id}.pdf`,
				caption: `New BASTO order ${order.id} - ${order.customer_name} - ${naira(order.total)}`
			}
		})
	});
	const result = await send.json();
	if (!send.ok) throw new Error(`Send failed: ${JSON.stringify(result)}`);
};

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const handleReceipt = async (request, env) => {
	if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
	if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_URL || !env.OWNER_WHATSAPP) {
		return json({ error: 'WhatsApp receipts are not configured.' }, 503);
	}
	let orderId;
	try { orderId = (await request.json()).orderId; } catch { return json({ error: 'Invalid request' }, 400); }
	if (typeof orderId !== 'string' || !/^BST-[A-Z0-9]{1,20}$/.test(orderId)) return json({ error: 'Invalid order' }, 400);

	const lookup = await supabase(env, `orders?id=eq.${orderId}&select=*`);
	const [order] = lookup.ok ? await lookup.json() : [];
	if (!order || Date.now() - new Date(order.created_at).getTime() > MAX_ORDER_AGE_MS) return json({ error: 'Order not found' }, 404);

	// Claim atomically so the same order is never sent twice.
	const claim = await supabase(env, `orders?id=eq.${orderId}&whatsapp_receipt_sent_at=is.null`, {
		method: 'PATCH',
		headers: { Prefer: 'return=representation' },
		body: JSON.stringify({ whatsapp_receipt_sent_at: new Date().toISOString() })
	});
	if (!claim.ok) return json({ error: 'Could not record receipt delivery' }, 500);
	if (!(await claim.json()).length) return json({ ok: true, alreadySent: true });

	try {
		await sendReceipt(env, order, buildReceiptPdf(order));
		return json({ ok: true });
	} catch (error) {
		console.error('WhatsApp receipt failed', error.message);
		await supabase(env, `orders?id=eq.${orderId}`, { method: 'PATCH', body: JSON.stringify({ whatsapp_receipt_sent_at: null }) });
		return json({ error: 'Could not send receipt' }, 502);
	}
};

export default {
	async fetch(request, env) {
		if (new URL(request.url).pathname === '/api/order-receipt') return handleReceipt(request, env);
		return env.ASSETS.fetch(request);
	}
};
