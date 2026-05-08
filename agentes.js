// 1. CONFIGURACIÓN ÚNICA DE SUPABASE CON VERIFICACIÓN DE INSTANCIA GLOBAL
if (typeof _supabaseGlobal === 'undefined') {
    var _supabaseGlobal = supabase.createClient(
        'https://ydziovjsqimzyhgpvzwo.supabase.co', 
        'sb_publishable_evZRp02eu_NZB-JKD4xZFA_ecOYHMz3'
    );
}

const COSTO_HORA = 12; // Tarifa base por hora

/**
 * Carga la lista de agentes y genera las tarjetas dinámicamente
 */
async function cargarAgentes() {
    const grid = document.getElementById('gridAgentes');
    const loader = document.getElementById('cargandoAgentes');

    try {
        const { data: agentes, error } = await _supabaseGlobal
            .from('agentes')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;
        
        if (loader) loader.style.display = 'none';
        grid.innerHTML = '';

        agentes.forEach(agente => {
            // Normalizamos el estado para las clases CSS
            const est = (agente.estado || 'descanso').toLowerCase();
            const claseColor = est === 'disponible' ? 'estado-disponible' : 
                               (est === 'en servicio' || est === 'ocupado' ? 'estado-servicio' : 'estado-descanso');
            
            const estaDeshabilitado = est !== 'disponible' ? 'disabled' : '';
            const textoBoton = est === 'disponible' ? 'SOLICITAR SERVICIO' : 'NO DISPONIBLE';

            grid.innerHTML += `
                <div class="tarjeta-agente">
                    <img src="${agente.foto_url || 'https://ui-avatars.com/api/?name=' + agente.nombre}" 
                         class="foto-agente" 
                         onerror="this.src='https://via.placeholder.com/150'">
                    <h3>${agente.nombre}</h3>
                    <p>${agente.especialidad || 'Seguridad General'}</p>
                    <div style="margin-bottom:15px;">
                        <span class="indicador-estado ${claseColor}"></span>
                        <span style="text-transform: capitalize;">${agente.estado}</span>
                    </div>
                    <button class="btn-contratar" ${estaDeshabilitado} 
                        onclick="abrirModalContrato('${agente.id}', '${agente.nombre}', '${agente.especialidad}')">
                        ${textoBoton}
                    </button>
                </div>`;
        });
    } catch (err) { 
        console.error("Error al cargar agentes:", err); 
    }
}

/**
 * Abre el modal y prepara los datos para el envío
 */
function abrirModalContrato(id, nombre, especialidad) {
    const modal = document.getElementById('modalContrato');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('infoAgenteModal').innerText = `${nombre} - ${especialidad}`;
        document.getElementById('modal_agente_id').value = id;
        document.getElementById('modal_agente_nombre').value = nombre;
        document.getElementById('modal_agente_nombre').dataset.especialidad = especialidad;
        
        // Resetear precio a 1 hora por defecto
        document.getElementById('horas').value = 1;
        calcularPrecio(1);
    }
}

function cerrarModal() { 
    document.getElementById('modalContrato').style.display = 'none'; 
}

function calcularPrecio(horas) {
    const display = document.getElementById('precioDisplay');
    if (display) {
        display.innerText = `${horas * COSTO_HORA} Bs.`;
    }
}

/**
 * Procesa el contrato y actualiza la base de datos
 */
document.getElementById('formContrato').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtener sesión de forma segura
    const { data: { session } } = await _supabaseGlobal.auth.getSession();
    if (!session) {
        alert("Sesión expirada. Por favor, ingresa de nuevo.");
        window.location.href = 'login.html';
        return;
    }

    const idAgente = document.getElementById('modal_agente_id').value;
    const horas = parseInt(document.getElementById('horas').value);
    const emailAdmin = session.user.email;

    try {
        // 1. Guardar en la tabla de asignaciones
        const { error: errAsignacion } = await _supabaseGlobal
            .from('asignaciones_guardias')
            .insert([{ 
                agente_id: idAgente,
                agente_nombre: document.getElementById('modal_agente_nombre').value,
                ubicacion: document.getElementById('ubicacion').value,
                celular: document.getElementById('celular').value,
                horas_requeridas: horas,
                precio_total: horas * COSTO_HORA,
                usuario_responsable: emailAdmin // Columna verificada en SQL
            }]);

        if (errAsignacion) throw errAsignacion;

        // 2. Actualizar el estado del guardia para que no pueda ser contratado de nuevo
        const { error: errUpdate } = await _supabaseGlobal
            .from('agentes')
            .update({ estado: 'En Servicio' })
            .eq('id', idAgente);

        if (errUpdate) throw errUpdate;

        alert(`✅ Contrato confirmado con éxito para ${document.getElementById('modal_agente_nombre').value}.`);
        location.reload();

    } catch (err) {
        console.error("Error en el proceso de contrato:", err);
        alert("Error al procesar el contrato. Revisa la consola para más detalles.");
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', cargarAgentes);