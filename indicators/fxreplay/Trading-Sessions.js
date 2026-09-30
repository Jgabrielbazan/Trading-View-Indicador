//@version=1

// ===========================================================================
// Trading Sessions - FX Replay (FXR Script)
// ===========================================================================
// Port del indicador de sesiones escrito para TradingView en Pine v5.
//
// Dos diferencias de fondo con la version Pine, impuestas por la plataforma:
//
// 1. FXR Script expone Moment.js pero NO moment-timezone, asi que no existen
//    las zonas IANA. El horario de verano se calcula a mano aplicando las
//    reglas de Estados Unidos y de la Union Europea.
//
// 2. Los dibujos se crean y no se recalculan solos. Cada sesion se dibuja una
//    unica vez, cuando cierra, con el alto y el bajo ya definitivos.
// ===========================================================================

const HOUR_MS = 3600000;
const MIN_MS = 60000;

// Estado entre velas: onTick recorre las velas en orden, asi que alcanza con
// ir acumulando el alto y el bajo de la sesion que esta abierta.
const liveSessions = {};
const alreadyDrawn = {};

// Domingo n-esimo de un mes, a las 00:00 UTC. month va de 0 a 11.
const nthSundayUtc = (m, year, month, n) => {
    const first = m.utc([year, month, 1]);
    const shift = ((7 - first.day()) % 7) + (n - 1) * 7;
    return first.add(shift, 'days').valueOf();
};

// Ultimo domingo de un mes, a las 00:00 UTC.
const lastSundayUtc = (m, year, month) => {
    const end = m.utc([year, month, 1]).endOf('month').startOf('day');
    return end.subtract(end.day(), 'days').valueOf();
};

// EEUU: segundo domingo de marzo 07:00 UTC -> primer domingo de noviembre 06:00 UTC.
const isUsDst = (m, ts) => {
    const y = m.utc(ts).year();
    return ts >= nthSundayUtc(m, y, 2, 2) + 7 * HOUR_MS &&
           ts < nthSundayUtc(m, y, 10, 1) + 6 * HOUR_MS;
};

// UE: ultimo domingo de marzo -> ultimo domingo de octubre, ambos a las 01:00 UTC.
const isEuDst = (m, ts) => {
    const y = m.utc(ts).year();
    return ts >= lastSundayUtc(m, y, 2) + HOUR_MS &&
           ts < lastSundayUtc(m, y, 9) + HOUR_MS;
};

const offsetMinutes = (m, ts, mode, customHours) => {
    if (mode === 'Nueva York') return isUsDst(m, ts) ? -240 : -300;
    if (mode === 'Londres') return isEuDst(m, ts) ? 60 : 0;
    if (mode === 'Frankfurt') return isEuDst(m, ts) ? 120 : 60;
    if (mode === 'Tokio') return 540;
    if (mode === 'Personalizado') return Math.round(customHours * 60);
    return 0;
};

// Hora de pared como numero HHMM: las 14:30 devuelven 1430.
const wallClock = (m, ts, offMin) => {
    const d = m.utc(ts + offMin * MIN_MS);
    return d.hours() * 100 + d.minutes();
};

// "0800-1700" y "0800-1700:23456" devuelven { from: 800, to: 1700 }.
const parseSession = (raw) => {
    const body = String(raw).split(':')[0].replace(/\s+/g, '');
    const bits = body.split('-');
    return { from: parseInt(bits[0], 10), to: parseInt(bits[1], 10) };
};

// Si el fin no es mayor que el inicio, la sesion cruza la medianoche.
const insideWindow = (hhmm, from, to) =>
    from <= to ? (hhmm >= from && hhmm < to) : (hhmm >= from || hhmm < to);

// ===========================================================================
// CONFIGURACION
// ===========================================================================

init = () => {
    indicator({ onMainPanel: true, format: 'inherit' });

    const gTz = 'Zona horaria';
    input.str('Zona horaria', 'Nueva York', 'tzMode',
        ['UTC', 'Nueva York', 'Londres', 'Frankfurt', 'Tokio', 'Personalizado'],
        'Los horarios de cada sesion se interpretan en esta zona. El horario de verano se ajusta solo, salvo en "Personalizado".',
        gTz);
    input.float('Offset personalizado (horas)', -3, 'tzCustom', -12, 14, 0.5,
        'Solo se usa con la zona "Personalizado". Offset fijo contra UTC, sin horario de verano.',
        gTz);

    const gA = 'Asia';
    input.bool('Activar', true, 'asiaOn', undefined, gA, 'rowAsia');
    input.color('Color', '#5C6BC0', 'asiaCol', gA, undefined, 'rowAsia');
    input.session('Horario', '1900-0400', 'asiaSess', undefined, undefined, gA);
    input.str('Etiqueta', 'ASIA', 'asiaTxt', undefined, undefined, gA);

    const gL = 'Londres';
    input.bool('Activar', true, 'lonOn', undefined, gL, 'rowLon');
    input.color('Color', '#26A69A', 'lonCol', gL, undefined, 'rowLon');
    input.session('Horario', '0300-1130', 'lonSess', undefined, undefined, gL);
    input.str('Etiqueta', 'LONDON', 'lonTxt', undefined, undefined, gL);

    const gC = 'Londres Close';
    input.bool('Activar', true, 'lcOn', undefined, gC, 'rowLc');
    input.color('Color', '#FFA726', 'lcCol', gC, undefined, 'rowLc');
    input.session('Horario', '1000-1200', 'lcSess', undefined, undefined, gC);
    input.str('Etiqueta', 'LDN CLOSE', 'lcTxt', undefined, undefined, gC);

    const gN = 'Nueva York';
    input.bool('Activar', true, 'nyOn', undefined, gN, 'rowNy');
    input.color('Color', '#EF5350', 'nyCol', gN, undefined, 'rowNy');
    input.session('Horario', '0800-1700', 'nySess', undefined, undefined, gN);
    input.str('Etiqueta', 'NEW YORK', 'nyTxt', undefined, undefined, gN);

    const gS = 'Estilo';
    input.int('Velas de historial', 1000, 'histBars', 50, 20000, 50,
        'Solo se dibujan las sesiones de las ultimas N velas. Menos velas = grafico mas limpio y carga mas rapida.',
        gS);
    input.bool('Caja del rango', true, 'showBox', undefined, gS);
    input.bool('Rellenar la caja', false, 'fillBox', undefined, gS);
    input.int('Transparencia del relleno', 92, 'fillTransp', 50, 99, 1,
        'Mas alto = mas transparente.', gS);
    input.str('Borde de la caja', 'Punteado', 'borderStyle',
        ['Solido', 'Punteado', 'Rayado'], undefined, gS);
    input.bool('Lineas de alto y bajo', true, 'showLevels', undefined, gS);
    input.bool('Proyectar las lineas hacia adelante', false, 'extendLevels',
        'Las extiende hasta el borde derecho del grafico. Sin limite, asi que con varias sesiones ensucia.',
        gS);
    input.bool('Etiquetas', true, 'showLabel', undefined, gS);
    input.bool('Dibujar la sesion en curso', true, 'livePreview',
        'Muestra la caja formandose mientras la sesion esta abierta. Util en replay, paso a paso.',
        gS);
};

// ===========================================================================
// LOGICA
// ===========================================================================

onTick = (length, _moment, _, ta, inputs) => {
    if (index < 1) return;
    if (index < length - inputs.histBars) return;

    const m = _moment;
    const tzMode = inputs.tzMode;
    const tzCustom = inputs.tzCustom;

    // La caja en curso se redibuja vela a vela, asi que necesita borrarse.
    // Si la plataforma no expone el borrado, se apaga sola en vez de acumular.
    const canDelete = typeof deleteDrawingById === 'function';
    const livePreview = inputs.livePreview && canDelete;

    const borderStyle = inputs.borderStyle === 'Solido' ? 0
        : inputs.borderStyle === 'Punteado' ? 1
        : 2;

    const boxStyle = (col) => ({
        color: col,
        backgroundColor: col,
        fillBackground: inputs.fillBox,
        transparency: inputs.fillTransp,
        linewidth: 1,
        linestyle: borderStyle,
        extendRight: false
    });

    const defs = [
        { key: 'asia', on: inputs.asiaOn, raw: inputs.asiaSess, col: inputs.asiaCol, name: inputs.asiaTxt },
        { key: 'lon', on: inputs.lonOn, raw: inputs.lonSess, col: inputs.lonCol, name: inputs.lonTxt },
        { key: 'lc', on: inputs.lcOn, raw: inputs.lcSess, col: inputs.lcCol, name: inputs.lcTxt },
        { key: 'ny', on: inputs.nyOn, raw: inputs.nySess, col: inputs.nyCol, name: inputs.nyTxt }
    ];

    for (let i = 0; i < defs.length; i++) {
        const d = defs[i];
        if (!d.on) continue;

        const win = parseSession(d.raw);
        if (isNaN(win.from) || isNaN(win.to)) continue;

        const barInside = (k) => {
            const t = time(k);
            if (t === undefined || t === null || isNaN(t)) return false;
            const off = offsetMinutes(m, t, tzMode, tzCustom);
            return insideWindow(wallClock(m, t, off), win.from, win.to);
        };

        const nowIn = barInside(0);
        const prevIn = barInside(1);
        let st = liveSessions[d.key];

        if (nowIn) {
            if (!prevIn) {
                // Arranca la sesion. Solo se sigue a las que se ven empezar:
                // una sesion ya a mitad de camino daria un rango incompleto.
                st = { hi: high(0), lo: low(0), startT: time(0), boxId: null };
                liveSessions[d.key] = st;
            } else if (st) {
                if (high(0) > st.hi) st.hi = high(0);
                if (low(0) < st.lo) st.lo = low(0);
            }

            if (livePreview && st) {
                if (st.boxId) deleteDrawingById(st.boxId);
                st.boxId = rectangle(st.startT, st.hi, time(0), st.lo, boxStyle(d.col));
            }

        } else if (prevIn && st) {
            // La sesion cerro en la vela anterior: el rango ya es definitivo.
            if (st.boxId && canDelete) deleteDrawingById(st.boxId);

            const drawKey = d.key + '@' + st.startT;
            if (!alreadyDrawn[drawKey]) {
                alreadyDrawn[drawKey] = true;
                const endT = time(1);

                if (inputs.showBox) {
                    rectangle(st.startT, st.hi, endT, st.lo, boxStyle(d.col));
                }

                if (inputs.showLevels) {
                    const lineStyle = {
                        linecolor: d.col,
                        linewidth: 1,
                        linestyle: 1,
                        extendRight: inputs.extendLevels
                    };
                    trendLine(newPoint(st.startT, st.hi), newPoint(endT, st.hi), lineStyle);
                    trendLine(newPoint(st.startT, st.lo), newPoint(endT, st.lo), lineStyle);
                }

                if (inputs.showLabel) {
                    text(st.startT, st.hi, {
                        color: d.col,
                        fontsize: 11,
                        bold: false,
                        fillBackground: false,
                        drawBorder: false
                    }, d.name);
                }
            }

            liveSessions[d.key] = null;
        }
    }
};
