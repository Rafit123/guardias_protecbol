// Configuración de Supabase - Cambiamos el nombre para evitar errores de duplicidad
const supabaseUrl = 'https://ydziovjsqimzyhgpvzwo.supabase.co'; 
const supabaseKey = 'sb_publishable_evZRp02eu_NZB-JKD4xZFA_ecOYHMz3';
const instanciaSupabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- CONFIGURACIÓN DE ROLES ---
const ADMIN_EMAIL = "gomezrafaelleandro@gmail.com"; 

async function protegerRuta() {
    // Usamos la nueva variable instanciaSupabase
    const { data: { session }, error } = await instanciaSupabase.auth.getSession();

    // 1. Protección de ruta básica
    if (!session && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Lógica de Roles
    if (session) {
        // Normalizamos a minúsculas y limpiamos espacios
        const usuarioEsAdmin = session.user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
        
        // Guardamos el rol en el almacenamiento de sesión
        sessionStorage.setItem('esAdmin', usuarioEsAdmin);
        
        console.log(`Usuario: ${session.user.email} | Admin Detectado: ${usuarioEsAdmin}`);
        
        // Disparar un evento personalizado para avisar a lista.js que ya sabemos quién es el usuario
        window.dispatchEvent(new Event('authListo'));
    }
}

protegerRuta();
