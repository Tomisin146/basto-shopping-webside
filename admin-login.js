const loginForm = document.querySelector('#admin-login-form');
const usernameInput = document.querySelector('#admin-username');
const passwordInput = document.querySelector('#admin-password');
const loginError = document.querySelector('#login-error');
const inventoryApi = window.bastoInventoryApi;

if (!inventoryApi?.configured) {
    loginError.textContent = 'Connect this site to Supabase before signing in. See SUPABASE_SETUP.md.';
} else {
    inventoryApi.client.auth.getSession().then(({ data }) => {
        if (data.session) window.location.replace('admin.html');
    });

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        loginError.textContent = '';
        const { error } = await inventoryApi.client.auth.signInWithPassword({
            email: usernameInput.value.trim(),
            password: passwordInput.value
        });
        if (error) {
            loginError.textContent = 'Sign-in failed. Check your email and password.';
            passwordInput.select();
            return;
        }
        window.location.replace('admin.html');
    });
}
