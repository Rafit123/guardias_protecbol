// CONFIGURACIÓN CON VERIFICACIÓN PARA EVITAR ERRORES DE DECLARACIÓN
if (typeof _supabaseGlobal === 'undefined') {
    var _supabaseGlobal = supabase.createClient(
        'https://ydziovjsqimzyhgpvzwo.supabase.co', 
        'sb_publishable_evZRp02eu_NZB-JKD4xZFA_ecOYHMz3'
    );
}

// 2. Selección de los elementos del formulario
const loginForm = document.getElementById('loginForm');
const btnRegistro = document.getElementById('btnRegistro');

// --- LÓGICA PARA INGRESAR (LOGIN) ---
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (email === "" || password === "") {
            alert("Por favor, completa todos los campos para ingresar.");
            return;
        }

        const { data, error } = await _supabaseGlobal.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            alert("Error al ingresar: " + error.message);
        } else {
            alert("¡Bienvenido a Seguridad Pro!");
            window.location.replace('index.html'); 
        }
    });
}

// --- LÓGICA PARA REGISTRARSE (SIGN UP) ---
if (btnRegistro) {
    btnRegistro.addEventListener('click', async () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) {
            alert("Debes ingresar un correo y una contraseña para registrarte.");
            return;
        }

        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        const { data, error } = await _supabaseGlobal.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            alert("Error al registrar: " + error.message);
        } else {
            alert("Registro exitoso. ¡Ahora ya puedes presionar el botón 'INGRESAR'!");
        }
    });
}
