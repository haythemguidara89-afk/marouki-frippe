// ==============================================================================
// MAROUKI FRIPPE - SUPABASE DATABASE CONFIGURATION & CLIENT (supabase-config.js)
// ==============================================================================
// Connects Marouki Frippe to the cloud Supabase PostgreSQL database.
// Project URL: https://pmaslgwawmbpeoahwxfv.supabase.co
// Features: Real-time inventory synchronization, cloud orders, passkeys & settings.

const MAROUKI_SUPABASE_CONFIG = {
    // Shared Supabase Project URL
    url: "https://pmaslgwawmbpeoahwxfv.supabase.co",
    // Shared Anon Public Key
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtYXNsZ3dhd21icGVvYWh3eGZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyODY4MTMsImV4cCI6MjEwNjg2MjgxM30.oqWVU5Qp3Th0Velnqhb4YkLF1KtiVyOas2Igk501Vow"
};

function getActiveSupabaseConfig() {
    const localUrl = (typeof localStorage !== 'undefined') ? (localStorage.getItem('marouki_supabase_url') || '').trim() : '';
    const localKey = (typeof localStorage !== 'undefined') ? (localStorage.getItem('marouki_supabase_key') || '').trim() : '';

    const url = localUrl || MAROUKI_SUPABASE_CONFIG.url;
    const anonKey = localKey || MAROUKI_SUPABASE_CONFIG.anonKey;

    const isConfigured = Boolean(
        url &&
        anonKey &&
        url.startsWith("http") &&
        anonKey.length > 20
    );

    return { url, anonKey, isConfigured };
}

let maroukiSupabase = null;
let isSupabaseConnected = false;

function initSupabaseClient() {
    const { url, anonKey, isConfigured } = getActiveSupabaseConfig();

    if (isConfigured && typeof window !== 'undefined' && window.supabase) {
        try {
            maroukiSupabase = window.supabase.createClient(url, anonKey, {
                auth: { persistSession: false },
                realtime: { params: { eventsPerSecond: 10 } }
            });
            isSupabaseConnected = true;
            console.log("Marouki Frippe: Supabase PostgreSQL connected successfully!");
            window.dispatchEvent(new CustomEvent('maroukiSupabaseReady', { detail: { url } }));
        } catch (err) {
            console.error("Marouki Frippe: Failed to initialize Supabase client:", err);
            maroukiSupabase = null;
            isSupabaseConnected = false;
        }
    } else {
        maroukiSupabase = null;
        isSupabaseConnected = false;
    }
    return maroukiSupabase;
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
    initSupabaseClient();
}
