(() => {
    const config = window.BASTO_SUPABASE_CONFIG || {};
    const configured = Boolean(
        window.supabase?.createClient &&
        config.url &&
        config.anonKey &&
        !config.url.includes('YOUR_PROJECT_ID') &&
        !config.anonKey.includes('YOUR_SUPABASE_')
    );
    const client = configured ? window.supabase.createClient(config.url, config.anonKey) : null;

    const requireClient = () => {
        if (!client) throw new Error('Add your Supabase project URL and anon key in supabase-config.js.');
        return client;
    };

    window.bastoInventoryApi = {
        configured,
        client,
        async listProducts() {
            const { data, error } = await requireClient()
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        async saveProduct(item) {
            const record = {
                id: item.id,
                name: item.name,
                category: item.category,
                description: item.description,
                sizes: item.sizes || [],
                colors: item.colors,
                price: Number(item.price),
                stock: Number(item.stock),
                sold: Number(item.sold),
                image: item.image || '',
                available: item.available !== false
            };
            const { error } = await requireClient().from('products').upsert(record);
            if (error) throw error;
        },
        async deleteProduct(id) {
            const { error } = await requireClient().from('products').delete().eq('id', id);
            if (error) throw error;
        },
        async createOrder(order) {
            const { error } = await requireClient().from('orders').insert(order);
            if (error) throw error;
        },
        async listOrders() {
            const { data, error } = await requireClient()
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        async updateOrderStatus(id, status) {
            const { error } = await requireClient()
                .from('orders')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
        },
        async uploadPaymentReceipt(file, orderId) {
            const extensions = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
                'application/pdf': 'pdf'
            };
            const extension = extensions[file.type];
            if (!extension) throw new Error('Receipt must be a JPG, PNG, WebP image, or PDF.');
            if (file.size > 5 * 1024 * 1024) throw new Error('Receipt must be 5 MB or smaller.');
            const safeOrderId = String(orderId).replace(/[^A-Za-z0-9-]/g, '');
            const fileId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const path = `${safeOrderId}/${fileId}.${extension}`;
            const { error } = await requireClient()
                .storage
                .from('payment-receipts')
                .upload(path, file, { contentType: file.type, upsert: false });
            if (error) throw error;
            return path;
        },
        async createPaymentReceiptUrl(path) {
            const { data, error } = await requireClient()
                .storage
                .from('payment-receipts')
                .createSignedUrl(path, 600);
            if (error) throw error;
            return data.signedUrl;
        }
    };
})();