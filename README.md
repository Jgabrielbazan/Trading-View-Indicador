# Trading View Indicador 📊

Indicadores personalizados de Pine Script para TradingView con enfoque en sesiones de trading globales.

## 🎯 Indicadores Disponibles

### Trading Sessions
Indicador que visualiza las principales sesiones de trading (Asia, Londres, Nueva York) con total configurabilidad.

**Características:**
- ✅ Marca las 3 sesiones principales: Asia, Londres, Nueva York
- ✅ Horarios completamente configurables
- ✅ Colores personalizables por sesión
- ✅ Labels dinámicos para cada sesión
- ✅ Background coloreado según la sesión activa
- ✅ Alertas al cambiar de sesión
- ✅ Interfaz intuitiva de inputs en TradingView

## 📋 Configuración del Indicador

### Horarios por Defecto (en UTC)
- **Asia:** 22:00 - 06:00 UTC
- **Londres:** 07:00 - 15:00 UTC  
- **Nueva York:** 13:00 - 21:00 UTC

> ⏰ Los horarios están configurados en UTC. Puedes ajustarlos según tu zona horaria en la configuración del indicador.

### Opciones Personalizables

#### Session Times (Tiempos de Sesión)
- `Asia Start` - Inicio de sesión Asia (default: 22:00 UTC)
- `Asia End` - Fin de sesión Asia (default: 06:00 UTC)
- `London Start` - Inicio de sesión Londres (default: 07:00 UTC)
- `London End` - Fin de sesión Londres (default: 15:00 UTC)
- `New York Start` - Inicio de sesión NY (default: 13:00 UTC)
- `New York End` - Fin de sesión NY (default: 21:00 UTC)

#### Colors (Colores)
- `Asia Color` - Color para sesión Asia (default: Azul)
- `London Color` - Color para sesión Londres (default: Naranja)
- `New York Color` - Color para sesión Nueva York (default: Rojo)

#### Labels (Etiquetas)
- `Asia Label` - Texto para sesión Asia (default: "ASIA")
- `London Label` - Texto para sesión Londres (default: "LONDON")
- `New York Label` - Texto para sesión NY (default: "NEW YORK")

#### Display (Visualización)
- `Show Session Labels` - Mostrar/ocultar etiquetas
- `Show Session Box` - Mostrar/ocultar background coloreado
- `Label Size` - Tamaño de las etiquetas

## 🚀 Cómo Usar

### En TradingView:

1. Abre TradingView.com
2. Ve a **Pine Script Editor** (o **More** → **Pine Script Editor**)
3. Copia el contenido del archivo `Trading-Sessions.pine`
4. Pega el código en el editor
5. Presiona **Add to Chart**
6. Personaliza los valores según tus preferencias

### Convertir a Strategy (Opcional)

Si deseas usar esto como base para una estrategia, puedes modificar la primera línea:
```pine
//@version=5
strategy("Trading Sessions Strategy", overlay=true)
```

## 🎨 Ejemplos de Personalización

### Cambiar Horarios a Horario de Nueva York (EST/EDT)

En la configuración del indicador:
- Asia Start: **17:00 EST**
- London Start: **02:00 EST**
- New York Start: **08:00 EST**

### Usar Temas Corporativos

- Asia: Verde (#26A69A)
- Londres: Azul (#42A5F5)
- Nueva York: Rojo (#EF5350)

## 📝 Notas Importantes

- ⏰ Los horarios cambiarán automáticamente según el cambio de horario de verano/invierno
- 🔔 Las alertas se dispararán cuando cambies de sesión
- 🎯 El indicador funciona en cualquier timeframe
- 📊 Compatible con todos los pares de forex y otros activos

## 📚 Recursos Útiles

- [Documentación de Pine Script](https://www.tradingview.com/pine-script-docs/)
- [Comunidad TradingView](https://www.tradingview.com/community/)
- [Horarios de Sesiones de Trading](https://www.investopedia.com/articles/forex/08/forex-market-hours.asp)

## 📄 Licencia

Este proyecto está disponible para uso personal.

---

**Versión:** 1.0.0  
**Última actualización:** 2026-09-29
