if (typeof _supabaseGlobal === 'undefined') {
    var _supabaseGlobal = supabase.createClient(
        'https://ydziovjsqimzyhgpvzwo.supabase.co', 
        'sb_publishable_evZRp02eu_NZB-JKD4xZFA_ecOYHMz3'
    );
}

// Diccionario de retroalimentación profesional
const recomendacionesIA = {
    p1: "⚠️ Protocolo de Perímetro: El guardia debe priorizar el reporte antes que la confrontación.",
    p2: "⚠️ Uso de Fuerza: Falla en reconocer la fuerza como último recurso legal y ético.",
    p3: "⚠️ Cadena de Mando: Un guardia debe cuestionar órdenes irregulares que violen la seguridad.",
    p4: "⚠️ Riesgo Físico: Nunca manipule objetos sospechosos; aislar el área es vital.",
    p5: "⚠️ Humanidad y Deber: La omisión de auxilio es una falta grave al protocolo.",
    p6: "⚠️ Inteligencia Emocional: La agresividad verbal es inaceptable en seguridad privada.",
    p7: "⚠️ Documentación: Los informes deben ser detallados y veraces, no rápidos.",
    p8: "⚠️ Integridad: Guardar silencio ante faltas éticas compromete a toda la agencia.",
    p9: "⚠️ Enfoque de Servicio: La detención violenta no es la función principal, es la prevención.",
    p10: "⚠️ Competencia Técnica: Se requiere capacitación urgente en el manejo de extintores."
};

async function verificarSesion() {
    try {
        const { data: { session }, error } = await _supabaseGlobal.auth.getSession();
        if (error || !session) {
            window.location.href = 'login.html';
        } else {
            document.body.style.visibility = 'visible';
            document.body.style.opacity = '1';
        }
    } catch (err) {
        window.location.href = 'login.html';
    }
}
verificarSesion();

const formulario = document.getElementById('registroForm');

formulario.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('btnConfirmar');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analizando Perfil...';

    // 1. Cálculo silencioso del puntaje y captura de errores
    let puntajeTotal = 0;
    let erroresDetectados = [];

    for (let i = 1; i <= 10; i++) {
        const select = document.getElementById(`p${i}`);
        const valor = parseInt(select.value) || 0;
        puntajeTotal += valor;
        
        if (valor === 0) {
            erroresDetectados.push(recomendacionesIA[`p${i}`]);
        }
    }

    const nombre = document.getElementById('nombre').value;
    const estatura = parseInt(document.getElementById('estatura').value);
    const antecedentes = document.getElementById('antecedentes').value;
    const fotoArchivo = document.getElementById('foto').files[0]; 
    const resultadoFinal = puntajeTotal >= 80 ? "Apto" : "No Apto";

    try {
        const { data: { session } } = await _supabaseGlobal.auth.getSession();
        const emailAdmin = session ? session.user.email : 'anonimo@test.com';
        let urlPublica = null;

        // Subida de foto
        if (fotoArchivo) {
            const extension = fotoArchivo.name.split('.').pop();
            const nombreArchivo = `${Date.now()}_${nombre.replace(/\s+/g, '_')}.${extension}`;
            await _supabaseGlobal.storage.from('imagenes_aspirantes').upload(nombreArchivo, fotoArchivo);
            const { data: urlData } = _supabaseGlobal.storage.from('imagenes_aspirantes').getPublicUrl(nombreArchivo);
            urlPublica = urlData.publicUrl;
        }

        // Guardar en Supabase
        const { error: errAsp } = await _supabaseGlobal.from('aspirantes').insert([{ 
            nombre, estatura, antecedentes, puntaje_ia: puntajeTotal,
            resultado: resultadoFinal, resultado_ia: resultadoFinal,
            email_usuario: emailAdmin, foto_url: urlPublica 
        }]);

        if (errAsp) throw errAsp;

        // MOSTRAR REPORTE FINAL
        formulario.style.display = 'none';
        document.getElementById('linkVolver').style.display = 'none';
        const seccionReporte = document.getElementById('seccionReporteIA');
        seccionReporte.style.display = 'block';

        // Badge de resultado
        document.getElementById('resultadoFinalBadge').innerHTML = `
            <span class="${resultadoFinal === 'Apto' ? 'badge-apto' : 'badge-no-apto'}">
                PERFIL: ${resultadoFinal.toUpperCase()} (${puntajeTotal}/100)
            </span>
        `;

        // Lista de feedback
        const listaFeedback = document.getElementById('listaFeedbackIA');
        if (erroresDetectados.length > 0) {
            listaFeedback.innerHTML = erroresDetectados.map(err => `<p style="margin-bottom:8px;">${err}</p>`).join('');
        } else {
            listaFeedback.innerHTML = "✅ No se detectaron fallas críticas. Perfil ético y técnico excelente.";
        }

    } catch (error) {
        alert('Error: ' + error.message);
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> FINALIZAR Y EVALUAR';
    }
});
