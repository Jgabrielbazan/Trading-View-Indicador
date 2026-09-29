# Trading View Indicador

Indicadores en Pine Script v5 para TradingView.

## Trading Sessions

Marca las sesiones de Asia, Londres, Londres Close y Nueva York, con el rango
(alto y bajo) de cada una.

### Qué dibuja

- **Caja de rango**: una caja por sesión que se extiende mientras la sesión está
  abierta y cierra exactamente en el alto y el bajo alcanzados.
- **Líneas de alto y bajo**: se pueden proyectar hacia adelante una vez cerrada
  la sesión, hasta que arranque la siguiente.
- **Etiqueta** con el nombre de la sesión.
- **Fondo coloreado** (opcional, apagado por defecto).
- **Alertas** en la apertura de cada sesión.

### Zona horaria

El selector `Zona horaria` define en qué zona se interpretan los horarios:

- `Exchange` — usa la zona horaria del gráfico (`syminfo.timezone`).
- Zonas IANA: `UTC`, `America/New_York`, `Europe/London`, `Asia/Tokyo`,
  `Europe/Berlin`, `America/Argentina/Buenos_Aires`.

La detección usa `time(timeframe.period, sesión, zona)`, que maneja de forma
nativa el horario de verano y las sesiones que cruzan medianoche. No hay offsets
calculados a mano.

### Horarios por defecto

Expresados en hora de Nueva York (`America/New_York`, el valor por defecto):

| Sesión        | Horario     |
| ------------- | ----------- |
| Asia          | 19:00–04:00 |
| Londres       | 03:00–11:30 |
| Londres Close | 10:00–12:00 |
| Nueva York    | 08:00–17:00 |

Cada uno es editable con el selector de sesión de TradingView. El formato es
`HHMM-HHMM`, y admite días (`0800-1700:23456` para lunes a viernes).

Las sesiones se solapan a propósito — Londres Close cae dentro de Nueva York.
Cada una dibuja su propia caja, así que el solape se ve sin problema. El fondo
coloreado, en cambio, solo puede mostrar un color a la vez: la prioridad es
Londres Close → Londres → Asia → Nueva York.

### Configuración

Por sesión: activar/desactivar, horario, color de borde, color de relleno y
etiqueta.

Globales: mostrar caja, mostrar líneas, extender líneas al cerrar, mostrar
etiquetas, mostrar fondo, grosor de línea y tamaño de etiqueta.

### Uso

1. En TradingView, abrir el **Pine Editor**.
2. Pegar el contenido de `indicators/Trading-Sessions.pine`.
3. **Add to chart**.
4. Ajustar los parámetros desde el engranaje del indicador.

## Notas de Pine Script v5

Restricciones del lenguaje que condicionan cómo está escrito el indicador:

- `bgcolor()`, `plot()`, `barcolor()`, `hline()` y `alertcondition()` solo se
  pueden llamar en scope global, nunca dentro de un `if`. Para condicionarlas se
  usa un ternario: `bgcolor(cond ? col : na)`.
- El `message` de `alertcondition()` debe ser un string constante. Para mensajes
  dinámicos hay que usar `alert()`, que sí acepta series.
- No existe `math.fmod()`. El módulo es el operador `%`.
- Un indicador necesita al menos una función de dibujo en scope global, o no
  compila.
