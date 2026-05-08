// 1. CONFIGURACIÓN ÚNICA DE SUPABASE
if (typeof _supabaseGlobal === 'undefined') {
    var _supabaseGlobal = supabase.createClient(
        'https://ydziovjsqimzyhgpvzwo.supabase.co', 
        'sb_publishable_evZRp02eu_NZB-JKD4xZFA_ecOYHMz3'
    );
}

let paqueteSeleccionado = null;

/**
 * Carga los paquetes desde la base de datos
 */
async function cargarPaquetes() {
    const grid = document.getElementById('gridPaquetes');
    const loader = document.getElementById('loader');

    try {
        const { data: paquetes, error } = await _supabaseGlobal
            .from('paquetes')
            .select('*')
            .order('precio_bs', { ascending: true });

        if (error) throw error;

        loader.style.display = 'none';
        grid.innerHTML = '';

        paquetes.forEach(pkg => {
            const descEscapada = pkg.descripcion.replace(/'/g, "\\'");
            
            grid.innerHTML += `
                <div class="tarjeta-paquete">
                    <h2 style="color: #0f172a;">${pkg.nombre}</h2>
                    <div class="precio">${pkg.precio_bs} <span>Bs.</span></div>
                    
                    <ul class="lista-detalles">
                        <li><i class="fas fa-user-shield"></i> ${pkg.cantidad_guardias} Guardia(s)</li>
                        <li><i class="fas fa-clock"></i> ${pkg.horas_servicio} Horas de servicio</li>
                        <li><i class="fas fa-check-circle"></i> ${pkg.descripcion}</li>
                        <li><i class="fas fa-user-tie"></i> Supervisor: ${pkg.incluye_supervisor ? 'Incluido' : 'No incluido'}</li>
                    </ul>

                    <button class="btn-seleccionar" onclick="abrirModalPaquete('${pkg.nombre}', ${pkg.precio_bs}, '${descEscapada}')">
                        CONTRATAR PAQUETE
                    </button>
                </div>
            `;
        });

    } catch (err) {
        console.error("Error:", err);
        loader.innerHTML = `<p style="color:red; font-weight:bold;">Error al conectar con la central.</p>`;
    }
}

function abrirModalPaquete(nombre, precio, descripcion) {
    paqueteSeleccionado = { nombre, precio };
    const modal = document.getElementById('modalPaquete');
    if (modal) {
        modal.style.display = 'flex';
        // Reset de vistas por si acaso
        document.getElementById('seccionFormulario').style.display = 'block';
        document.getElementById('seccionTicket').style.display = 'none';

        document.getElementById('tituloPaquete').innerText = nombre;
        document.getElementById('descPaquete').innerText = `Detalles: ${descripcion}`;
        document.getElementById('montoFinal').innerText = `${precio} Bs.`;
    }
}

function cerrarModalPaquete() {
    document.getElementById('modalPaquete').style.display = 'none';
}

/**
 * LÓGICA DE CONTRATACIÓN Y GENERACIÓN DE TICKET
 */
const formContrato = document.getElementById('formContratoPaquete');
if (formContrato) {
    formContrato.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando Orden...';

        try {
            const { data: { session } } = await _supabaseGlobal.auth.getSession();
            
            const cliente = document.getElementById('clienteNombre').value.trim();
            const ubicacion = document.getElementById('clienteUbicacion').value.trim();
            const telefono = document.getElementById('clienteTelefono').value.trim();
            const metodo = document.getElementById('metodoPagoPaquete').value;

            const datosContrato = {
                paquete_nombre: paqueteSeleccionado.nombre,
                precio_total: paqueteSeleccionado.precio,
                cliente_nombre: cliente,
                ubicacion: ubicacion,
                telefono: telefono,
                metodo_pago: metodo,
                usuario_registro: session ? session.user.email : 'anonimo@protecbol.com'
            };

            const { error } = await _supabaseGlobal
                .from('contrataciones_paquetes')
                .insert([datosContrato]);

            if (error) throw error;

            // --- GENERACIÓN DEL TICKET VISUAL ---
            const nroOrden = "SP-" + Math.floor(Math.random() * 900000 + 100000);
            
            // Ocultamos formulario, mostramos ticket
            document.getElementById('seccionFormulario').style.display = 'none';
            document.getElementById('seccionTicket').style.display = 'block';
            
            document.getElementById('ticketID').innerText = `ORDEN NRO: ${nroOrden}`;
            document.getElementById('ticketDetalle').innerHTML = `
                <p><strong>Cliente:</strong> ${cliente}</p>
                <p><strong>Servicio:</strong> ${paqueteSeleccionado.nombre}</p>
                <p><strong>Total:</strong> ${paqueteSeleccionado.precio} Bs.</p>
                <p><strong>Ubicación:</strong> ${ubicacion}</p>
                <p><strong>Método:</strong> ${metodo}</p>
            `;

            // Generar QR Dinámico usando API gratuita
            const qrData = encodeURIComponent(`Pago Seguridad Pro Orden:${nroOrden} Total:${paqueteSeleccionado.precio}Bs`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`;
            document.getElementById('contenedorQR').innerHTML = `<img src="${qrUrl}" alt="QR de Pago" style="width: 100%;">`;

        } catch (err) {
            console.error("Error:", err);
            alert("Hubo un error: " + err.message);
            btn.disabled = false;
            btn.innerHTML = 'CONFIRMAR CONTRATACIÓN';
        }
    });
}

document.addEventListener('DOMContentLoaded', cargarPaquetes);