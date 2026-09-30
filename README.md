# Trading View Indicador

Indicadores en Pine Script v5 para TradingView.

- [CRT — Candle Range Theory](#crt--candle-range-theory)
- [Trading Sessions](#trading-sessions)

## CRT — Candle Range Theory

`indicators/CRT.pine`

Detecta el modelo CRT: una vela de referencia define un rango, la siguiente
barre uno de sus extremos y **cierra de vuelta adentro** (la barrida fue falsa),
y el movimiento real se desarrolla hacia el extremo opuesto del rango.

Es el ciclo AMD aplicado a dos velas:

| Fase | Dónde | Qué pasa |
| ---- | ----- | -------- |
| **A**cumulación | Vela de referencia | Se forma el rango (alto y bajo) |
| **M**anipulación | Vela siguiente | Barre el alto o el bajo y cierra adentro |
| **D**istribución | Velas siguientes | El precio va al extremo opuesto del rango |

En términos de Wyckoff: la barrida del bajo es un **Spring** (sesgo alcista) y
la barrida del alto un **Upthrust** (sesgo bajista).

### Qué dibuja

Por defecto, cuatro elementos por setup:

- **Caja del rango** — punteada, sin relleno. Arranca en la vela de referencia
  (borde superior = alto del rango, inferior = bajo) y **se extiende con el
  precio hasta que el setup toca objetivo o stop**, así se ve de un vistazo qué
  zona sigue viva.
- **Marcador de señal** — triángulo chico arriba o abajo de la vela de
  detección.
- **Línea de objetivo** — punteada, desde la caja hacia adelante. Se congela en
  el punto exacto del desenlace.
- **Marca de la barrida** — línea corta sobre el extremo que fue barrido.

Opcionales (apagados por defecto): línea de entrada, línea de stop, etiqueta de
R:R, etiquetas AMD, panel de estado y detección de consolidaciones.

**Dos capas distintas**: los triángulos quedan en **todo el historial** (sirven
para revisar hacia atrás), mientras que las cajas y las líneas solo se mantienen
para los últimos N setups (`Setups en pantalla`, 5 por defecto). Por eso vas a
ver triángulos viejos sin caja: es intencional, no un error. Si los querés
emparejar, subí `Setups en pantalla` o apagá el marcador.

### Temporalidad

`Temporalidad del rango` define la vela de referencia (por defecto H4). El
gráfico tiene que ser de una temporalidad **menor** que esa: el CRT se detecta
en la vela grande y se opera en la chica. Si el gráfico es mayor, el indicador
muestra un aviso.

Los datos se leen con `request.security(..., lookahead_off)` y desplazamiento
explícito (`[1]`, `[2]`), así que **no repinta**: la señal aparece cuando la vela
de manipulación ya cerró.

### Filtros de calidad

Cuanto más exigentes, menos setups y gráfico más limpio.

| Filtro | Por defecto | Qué hace |
| ------ | ----------- | -------- |
| Solo barrida de un lado | Sí | Descarta la vela que barre alto y bajo a la vez (dirección ambigua) |
| Barrida mínima | 2% del rango | La mecha tiene que pasar el nivel al menos ese porcentaje |
| Cierre de rechazo | Sí | El cierre debe quedar en la mitad opuesta a la barrida |
| R:R mínimo | 0 (sin filtro) | Descarta el setup cuyo objetivo no alcance ese múltiplo del riesgo |

### Niveles

- **Entrada** — tres modos: retest del nivel barrido (por defecto), 50% de la
  mecha de barrida, o cierre de la vela de manipulación.
- **Stop** — más allá del extremo barrido, con colchón configurable.
- **Objetivo** — el extremo opuesto del rango.

Un setup se considera **invalidado** cuando el precio cierra más allá del stop
antes de llegar al objetivo. Queda marcado en gris (o se borra, según
configuración).

### Consolidación

Módulo aparte, apagado por defecto. Marca rangos laterales que cumplan:

- Ancho menor a N veces el ATR(14)
- Al menos 3 toques en el techo y 3 en el piso

Sirve como contexto: un CRT que barre el extremo de una consolidación tiene más
liquidez detrás.

### Alertas

Apertura alcista, apertura bajista, cualquier dirección, objetivo alcanzado y
setup invalidado.

## Trading Sessions

`indicators/Trading-Sessions.pine`

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

## Uso

1. En TradingView, abrir el **Pine Editor**.
2. Pegar el contenido del `.pine` que quieras (`indicators/CRT.pine` o
   `indicators/Trading-Sessions.pine`).
3. **Add to chart**.
4. Ajustar los parámetros desde el engranaje del indicador.

Si el indicador queda en su propio panel en vez de sobre las velas, en el
engranaje → **Escala de precios** elegir **Anclar a escala → Derecha**, la misma
que usa el símbolo.

## Notas de Pine Script v5

Restricciones del lenguaje que condicionan cómo están escritos los indicadores:

- `bgcolor()`, `plot()`, `plotshape()`, `barcolor()`, `hline()` y
  `alertcondition()` solo se pueden llamar en scope global, nunca dentro de un
  `if`. Para condicionarlas se usa un ternario o una serie booleana:
  `bgcolor(cond ? col : na)`, `plotshape(cond, ...)`.
- El `message` de `alertcondition()` debe ser un string constante. Para mensajes
  dinámicos hay que usar `alert()`, que sí acepta series.
- No existe `math.fmod()`. El módulo es el operador `%`.
- Un indicador necesita al menos una función de dibujo en scope global, o no
  compila.
- Los ternarios partidos en varias líneas son la causa más común del error
  `end of line without line continuation`. Conviene resolverlos con una cadena
  `if / else if` cuando la expresión es larga.
- v5 sí tiene tipos definidos por el usuario (`type`), colecciones genéricas
  (`array.new<MiTipo>()`) y parámetros tipados en funciones. `CRT.pine` los usa
  para agrupar los dibujos de cada setup en un solo objeto.
- Para leer una temporalidad superior sin repintar hay que combinar
  `lookahead_off` con desplazamiento explícito: `request.security(sym, tf,
  close[1], lookahead = barmerge.lookahead_off)` devuelve la vela ya cerrada.
