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
        }
    };
})();