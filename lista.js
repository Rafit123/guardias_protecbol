// 1. Configuración de Supabase con verificación global
if (typeof _supabaseGlobal === 'undefined') {
    var _supabaseGlobal = supabase.createClient(
        'https://ydziovjsqimzyhgpvzwo.supabase.co', 
        'sb_publishable_evZRp02eu_NZB-JKD4xZFA_ecOYHMz3'
    );
}

/**
 * Carga los aspirantes y verifica permisos de administrador
 */
async function cargarAspirantes() {
    const cuerpoTabla = document.getElementById('cuerpoTabla');
    const loader = document.getElementById('cargando');

    const { data: { session } } = await _supabaseGlobal.auth.getSession();
    const emailAdminDefinido = "gomezrafaelleandro@gmail.com";
    const esAdmin = sessionStorage.getItem('esAdmin') === 'true' || 
                   (session && session.user.email.toLowerCase() === emailAdminDefinido.toLowerCase());

    try {
        const { data, error } = await _supabaseGlobal
            .from('aspirantes')
            .select('*')
            .order('creado_en', { ascending: false });

        if (error) throw error;
        if (loader) loader.style.display = 'none';
        cuerpoTabla.innerHTML = '';

        if (data.length === 0) {
            cuerpoTabla.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">No hay aspirantes pendientes.</td></tr>';
            return;
        }

        data.forEach(aspirante => {
            const fecha = new Date(aspirante.creado_en).toLocaleDateString();
            const estadoActual = aspirante.resultado || aspirante.resultado_ia || 'Pendiente';
            const claseResultado = (estadoActual === 'Apto' || estadoActual === 'APTO') ? 'badge-apto' : 'badge-no-apto';

            const fotoHTML = aspirante.foto_url 
                ? `<img src="${aspirante.foto_url}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border: 2px solid #e2e8f0;">`
                : `<i class="fas fa-user-circle" style="font-size:40px; color:#cbd5e1;"></i>`;

            let celdaAcciones = "";
            if (esAdmin) {
                celdaAcciones = `
                    <td style="display:flex; gap:8px; justify-content: center;">
                        <button onclick="cambiarEstado('${aspirante.id}', 'Apto', '${aspirante.nombre}', event)" title="Contratar y Mover" style="background:#10b981; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;">
                            <i class="fas fa-user-check"></i>
                        </button>
                        <button onclick="cambiarEstado('${aspirante.id}', 'No Apto', '${aspirante.nombre}', event)" title="Rechazar y Eliminar" style="background:#ef4444; color:white; border:none; padding:8px; border-radius:6px; cursor:pointer;">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>`;
            } else {
                celdaAcciones = `<td style="text-align:center;"><i class="fas fa-lock" style="color:#cbd5e1;" title="Solo administradores"></i></td>`;
            }

            cuerpoTabla.innerHTML += `
                <tr>
                    <td style="text-align: center; vertical-align: middle;">${fotoHTML}</td>
                    <td><strong>${aspirante.nombre}</strong></td>
                    <td>${aspirante.estatura} cm</td>
                    <td>${aspirante.antecedentes.toUpperCase()}</td>
                    <td><span class="${claseResultado}">${estadoActual}</span></td>
                    <td>${fecha}</td>
                    ${celdaAcciones}
                </tr>
            `;
        });
    } catch (err) {
        console.error("Error:", err);
        if (loader) loader.innerHTML = `<p style="color:red; padding: 20px;">Error: ${err.message}</p>`;
    }
}

/**
 * LÓGICA DE MOVIMIENTO CON ANIMACIÓN SINCRONIZADA
 */
window.cambiarEstado = async (id, nuevoEstado, nombre, evento) => {
    const mensajeConfirmar = nuevoEstado === 'Apto' 
        ? `¿Confirmar contratación de ${nombre}?` 
        : `¿Rechazar a ${nombre}? Se eliminará permanentemente.`;

    if (!confirm(mensajeConfirmar)) return;

    const boton = evento.currentTarget;
    const fila = boton.closest('tr');

    try {
        if (nuevoEstado === 'Apto') {
            const { data: asp, error: errGet } = await _supabaseGlobal.from('aspirantes').select('*').eq('id', id).single();
            if (errGet) throw errGet;

            await _supabaseGlobal.from('agentes').insert([{
                nombre: asp.nombre,
                foto_url: asp.foto_url,
                estado: 'Disponible',
                especialidad: 'Seguridad General'
            }]);

            await _supabaseGlobal.from('aspirantes').delete().eq('id', id);
            fila.classList.add('fila-aprobada');
        } else {
            await _supabaseGlobal.from('aspirantes').delete().eq('id', id);
            fila.classList.add('fila-rechazada');
        }

        // Iniciar desvanecimiento
        fila.classList.add('fila-desvanecer');

        // Esperar a que la animación termine antes de mostrar el alert y recargar
        setTimeout(() => {
            if (nuevoEstado === 'Apto') {
                alert(`🎊 ¡Felicidades! ${nombre} ha sido contratado.`);
            } else {
                alert(`🗑️ Registro de ${nombre} eliminado.`);
            }
            location.reload();
        }, 600); // 600ms para asegurar que la transición de 0.5s se vea completa

    } catch (err) {
        console.error("Error:", err);
        alert("No se pudo completar la acción: " + err.message);
        fila.classList.remove('fila-aprobada', 'fila-rechazada', 'fila-desvanecer');
    }
};

window.addEventListener('authListo', cargarAspirantes);
if(sessionStorage.getItem('esAdmin') !== null) { cargarAspirantes(); }

document.getElementById('buscador').addEventListener('keyup', function() {
    const valorBusqueda = this.value.toLowerCase();
    const filas = document.querySelectorAll('#cuerpoTabla tr');
    filas.forEach(fila => {
        const nombreCelda = fila.querySelector('td:nth-child(2)');
        if (nombreCelda) {
            const nombreTexto = nombreCelda.textContent.toLowerCase();
            fila.style.display = nombreTexto.includes(valorBusqueda) ? '' : 'none';
        }
    });
});