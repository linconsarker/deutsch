/* Supabase browser client and per-user storage helpers. */
(function () {
  const SUPABASE_URL = "https://utracfubruhxjqseqcxb.supabase.co";
  const SUPABASE_KEY = "sb_publishable_fBn92noarDI3zYxIvz6h0A_r4kKzS_b";
  const storageKey = "deutsch-auth-user-id";
  let client;

  function getClient() {
    if (!client && window.supabase) client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return client;
  }

  window.DeutschAuth = {
    getClient,
    getScope() {
      try { return localStorage.getItem(storageKey) || "guest"; } catch (error) { return "guest"; }
    },
    scopedKey(baseKey) { return baseKey + ":" + this.getScope(); },
    async signUp(email, password) {
      const auth = getClient();
      return auth.auth.signUp({ email, password, options: { emailRedirectTo: window.location.href } });
    },
    async signIn(email, password) {
      return getClient().auth.signInWithPassword({ email, password });
    },
    async signOut() { return getClient().auth.signOut(); },
    async getSession() { return getClient().auth.getSession(); },
    onAuthStateChange(callback) { return getClient().auth.onAuthStateChange(callback); },
    setScope(user) {
      try { localStorage.setItem(storageKey, user ? user.id : "guest"); } catch (error) {}
    }
  };
})();
