async function loadPlanificacionJSON() {
    const res = await fetch('planificacion.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`No se pudo cargar planificacion.json (${res.status})`);
    return await res.json();
}

function extractOGId(ogText) {
    // "OG1: ..." => "OG1"
    if (!ogText) return '';
    const m = String(ogText).match(/\b(OG\d+)\b/);
    return m ? m[1] : '';
}

function stripOGPrefix(ogText) {
    // "OG1: Texto" => "Texto"
    if (!ogText) return '';
    return String(ogText).replace(/^\s*OG\d+\s*:\s*/i, '').trim();
}

function normalizePlanToRawData(planJson) {
    const plan = planJson?.plan_estrategico_crub;
    if (!Array.isArray(plan)) {
        throw new Error('Formato inesperado: falta plan_estrategico_crub[]');
    }

    const defaultColors = {
        OG1: '#3b82f6',
        OG2: '#10b981',
        OG3: '#f97316'
    };

    return plan.map(group => {
        const ogId = extractOGId(group.objetivo_general);
        const ogDescription = stripOGPrefix(group.objetivo_general);

        const specific_objectives = (group.objetivos_especificos || []).map(oe => {
            const metas = Array.isArray(oe.metas) ? oe.metas.join('\n\n') : (oe.metas || '');
            const acciones = Array.isArray(oe.acciones) ? oe.acciones.join('\n\n') : (oe.acciones || '');
            const indicadores = Array.isArray(oe.indicadores) ? oe.indicadores.join('\n\n') : (oe.indicadores || '');

            const detailsText = (oe.objetivo_especifico || oe.titulo || '').trim();
            const shortText = (oe.short_desc || detailsText || '').trim();
            const shortDesc = shortText
                .replace(/^\s*[A-Z]{2}\d+\s*[:.-]\s*/i, '')
                .trim();

            return {
                id: oe.id,
                short_desc: shortDesc || detailsText || oe.id,
                timeline: oe.plazo_ejecucion || '',
                details: detailsText || shortDesc || '',
                metas,
                acciones,
                indicadores,
                isCritical: Boolean(oe.isCritical)
            };
        });

        return {
            id: ogId || '',
            description: ogDescription,
            color: defaultColors[ogId] || '#64748b',
            specific_objectives
        };
    });
}

function escapeHTML(s) {
    return String(s)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function ogClassForId(ogId) {
    const map = { OG1: 'og-blue', OG2: 'og-green', OG3: 'og-orange' };
    return map[ogId] || 'og-blue';
}

async function getNormalizedPlanData() {
    const planJson = await loadPlanificacionJSON();
    return normalizePlanToRawData(planJson);
}
