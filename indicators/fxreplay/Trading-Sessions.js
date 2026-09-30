//@version=1

init = () => {
    indicator({ onMainPanel: true, format: 'inherit' });

    // Estado entre velas. onTick recorre las velas en orden, asi que alcanza
    // con ir acumulando el alto y el bajo de la sesion que esta abierta.
    fxrSess = { live: {}, drawn: {} };

    const gTz = 'Zona horaria';
    input.str('Zona horaria', 'Nueva York', 'tzMode',
        ['UTC', 'Nueva York', 'Londres', 'Frankfurt', 'Tokio', 'Personalizado'],
        'Los horarios de cada sesion se interpretan en esta zona. El horario de verano se ajusta solo, salvo en Personalizado.',
        gTz);
    input.float('Offset personalizado (horas)', -3, 'tzCustom', -12, 14, 0.5,
        'Solo se usa con la zona Personalizado. Offset fijo contra UTC, sin horario de verano.',
        gTz);

    const gA = 'Asia';
    input.bool('Activar', true, 'asiaOn', undefined, gA, 'rowAsia');
    // input.color solo acepta BaseColors o un objeto { r, g, b, a }, nunca un
    // string hexadecimal.
    input.color('Color', { r: 92, g: 107, b: 192, a: 1 }, 'asiaCol', gA, undefined, 'rowAsia');
    input.session('Horario', '1900-0400', 'asiaSess', undefined, undefined, gA);
    input.str('Etiqueta', 'ASIA', 'asiaTxt', undefined, undefined, gA);

    const gL = 'Londres';
    input.bool('Activar', true, 'lonOn', undefined, gL, 'rowLon');
    input.color('Color', { r: 38, g: 166, b: 154, a: 1 }, 'lonCol', gL, undefined, 'rowLon');
    input.session('Horario', '0300-1130', 'lonSess', undefined, undefined, gL);
    input.str('Etiqueta', 'LONDON', 'lonTxt', undefined, undefined, gL);

    const gC = 'Londres Close';
    input.bool('Activar', true, 'lcOn', undefined, gC, 'rowLc');
    input.color('Color', { r: 255, g: 167, b: 38, a: 1 }, 'lcCol', gC, undefined, 'rowLc');
    input.session('Horario', '1000-1200', 'lcSess', undefined, undefined, gC);
    input.str('Etiqueta', 'LDN CLOSE', 'lcTxt', undefined, undefined, gC);

    const gN = 'Nueva York';
    input.bool('Activar', true, 'nyOn', undefined, gN, 'rowNy');
    input.color('Color', { r: 239, g: 83, b: 80, a: 1 }, 'nyCol', gN, undefined, 'rowNy');
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
        'Las extiende hasta el borde derecho. Sin limite, asi que con varias sesiones ensucia.',
        gS);
    input.bool('Etiquetas', true, 'showLabel', undefined, gS);
    input.bool('Dibujar la sesion en curso', true, 'livePreview',
        'Muestra la caja formandose mientras la sesion esta abierta. Util en replay, paso a paso.',
        gS);
};

onTick = (length, _moment, _, ta, inputs) => {
    if (index < 1) return;
    if (index < length - inputs.histBars) return;

    if (typeof fxrSess === 'undefined' || !fxrSess) {
        fxrSess = { live: {}, drawn: {} };
    }

    const m = _moment;
    const HOUR_MS = 3600000;
    const MIN_MS = 60000;

    // --- AYUDANTES DE TIEMPO ---
    // FXR Script expone Moment.js pero no moment-timezone, asi que no hay
    // zonas IANA. El horario de verano se calcula con las reglas reales.

    // Domingo n-esimo de un mes, a las 00:00 UTC. month va de 0 a 11.
    const nthSundayUtc = (year, month, n) => {
        const first = m.utc([year, month, 1]);
        const shift = ((7 - first.day()) % 7) + (n - 1) * 7;
        return first.add(shift, 'days').valueOf();
    };

    // Ultimo domingo de un mes, a las 00:00 UTC.
    const lastSundayUtc = (year, month) => {
        const end = m.utc([year, month, 1]).endOf('month').startOf('day');
        return end.subtract(end.day(), 'days').valueOf();
    };

    // EEUU: 2do domingo de marzo 07:00 UTC -> 1er domingo de noviembre 06:00 UTC.
    const isUsDst = (ts) => {
        const y = m.utc(ts).year();
        return ts >= nthSundayUtc(y, 2, 2) + 7 * HOUR_MS &&
               ts < nthSundayUtc(y, 10, 1) + 6 * HOUR_MS;
    };

    // UE: ultimo domingo de marzo -> ultimo domingo de octubre, ambos 01:00 UTC.
    const isEuDst = (ts) => {
        const y = m.utc(ts).year();
        return ts >= lastSundayUtc(y, 2) + HOUR_MS &&
               ts < lastSundayUtc(y, 9) + HOUR_MS;
    };

    const offsetMinutes = (ts) => {
        const mode = inputs.tzMode;
        if (mode === 'Nueva York') return isUsDst(ts) ? -240 : -300;
        if (mode === 'Londres') return isEuDst(ts) ? 60 : 0;
        if (mode === 'Frankfurt') return isEuDst(ts) ? 120 : 60;
        if (mode === 'Tokio') return 540;
        if (mode === 'Personalizado') return Math.round(inputs.tzCustom * 60);
        return 0;
    };

    // Hora de pared como numero HHMM: las 14:30 devuelven 1430.
    const wallClock = (ts) => {
        const d = m.utc(ts + offsetMinutes(ts) * MIN_MS);
        return d.hours() * 100 + d.minutes();
    };

    // "0800-1700" y "0800-1700:23456" devuelven { from: 800, to: 1700 }.
    const parseSession = (raw) => {
        const body = String(raw).split(':')[0].replace(/\s+/g, '');
        const bits = body.split('-');
        return { from: parseInt(bits[0], 10), to: parseInt(bits[1], 10) };
    };

    // Si el fin no es mayor que el inicio, la sesion cruza la medianoche.
    const insideWindow = (hhmm, from, to) => {
        if (from <= to) return hhmm >= from && hhmm < to;
        return hhmm >= from || hhmm < to;
    };

    // --- ESTILOS ---

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

    // La caja en curso se redibuja vela a vela, asi que necesita borrarse. Si
    // la plataforma no expone el borrado, se apaga sola en vez de acumular.
    const canDelete = typeof deleteDrawingById === 'function';
    const livePreview = inputs.livePreview && canDelete;

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
            return insideWindow(wallClock(t), win.from, win.to);
        };

        const nowIn = barInside(0);
        const prevIn = barInside(1);
        let st = fxrSess.live[d.key];

        if (nowIn) {
            if (!prevIn) {
                // Arranca la sesion. Solo se siguen las que se ven empezar:
                // una ya a mitad de camino daria un rango incompleto.
                st = { hi: high(0), lo: low(0), startT: time(0), boxId: null };
                fxrSess.live[d.key] = st;
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
            if (!fxrSess.drawn[drawKey]) {
                fxrSess.drawn[drawKey] = true;
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

            fxrSess.live[d.key] = null;
        }
    }
};
