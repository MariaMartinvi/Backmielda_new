# Despliegue en Render con FFmpeg

Este documento explica cómo desplegar el backend en Render con soporte completo para FFmpeg.

## Problema Resuelto

El audio base64 se corrompía en producción porque FFmpeg no estaba disponible en el servidor de Render. Esto causaba que el frontend recibiera datos de audio inválidos.

## Solución Implementada

### 1. Configuración Automática de FFmpeg

- **Archivo**: `config/ffmpeg.js`
- **Funcionalidad**: Detecta automáticamente el entorno y usa:
  - FFmpeg del sistema en producción (Linux)
  - Binarios locales en desarrollo (Windows)

### 2. Script de Build para Render

- **Archivo**: `render-build.sh`
- **Funcionalidad**: Instala FFmpeg automáticamente durante el build en Render

### 3. Verificación de FFmpeg

- **Archivo**: `utils/audioMixer.js`
- **Funcionalidad**: Verifica si FFmpeg está disponible antes de intentar mezclar audio
- **Fallback**: Devuelve el audio TTS original si FFmpeg no está disponible

## Configuración en Render

### Variables de Entorno Requeridas

```bash
NODE_ENV=production
GOOGLE_APPLICATION_CREDENTIALS_JSON=<tu-json-de-credenciales>
MONGODB_URI=<tu-uri-de-mongodb>
SESSION_SECRET=<tu-secreto-de-sesion>
# ... otras variables de entorno
```

### Configuración del Servicio

1. **Build Command**: `npm run build`
2. **Start Command**: `npm start`
3. **Environment**: Node.js
4. **Region**: Cualquier región (recomendado: Oregon)

### Script de Build Personalizado

El archivo `render-build.sh` se ejecuta automáticamente y:

1. Actualiza la lista de paquetes del sistema
2. Instala FFmpeg via `apt-get`
3. Verifica la instalación
4. Instala dependencias de Node.js

## Verificación del Despliegue

### Logs a Buscar

```bash
# Configuración de FFmpeg
🐧 Using system FFmpeg (Linux/Production environment)
🔧 FFmpeg configuration: { ffmpeg: 'ffmpeg', ffprobe: 'ffprobe', ffplay: 'ffplay' }

# Verificación de FFmpeg
🔍 Checking FFmpeg availability...
✅ FFmpeg is available and working

# Mezcla de audio exitosa
🎵 STARTING AUDIO MIXING PROCESS 🎵
✅ FFmpeg process completed successfully
✅ AUDIO MIXING COMPLETE
```

### Logs de Error (si FFmpeg falla)

```bash
❌ FFmpeg is not available: <error-message>
⚠️ FFmpeg not available - returning original TTS audio without background music
```

## Solución de Problemas

### Si FFmpeg no se instala

1. **Verificar logs de build**: Buscar errores en la instalación de FFmpeg
2. **Permisos**: Render debería tener permisos para instalar paquetes del sistema
3. **Fallback**: La aplicación seguirá funcionando sin música de fondo

### Si el audio sigue corrupto

1. **Verificar variables de entorno**: Especialmente `NODE_ENV=production`
2. **Revisar logs**: Buscar errores en la generación de TTS
3. **Probar endpoint**: `/api/audio/generate` debería devolver JSON válido

### Comandos de Diagnóstico

```bash
# Verificar FFmpeg en el servidor
ffmpeg -version

# Probar generación de audio
curl -X POST https://tu-app.onrender.com/api/audio/generate \
  -H "Content-Type: application/json" \
  -d '{"text":"Hola mundo","voiceId":"female","musicTrack":"none"}'
```

## Archivos Modificados

- `config/ffmpeg.js` - Configuración automática de FFmpeg
- `utils/audioMixer.js` - Verificación y manejo de errores
- `package.json` - Script de build actualizado
- `render-build.sh` - Script de instalación de FFmpeg
- `scripts/install-ffmpeg.js` - Script alternativo de instalación

## Notas Importantes

1. **Primer despliegue**: Puede tomar más tiempo debido a la instalación de FFmpeg
2. **Música de fondo**: Solo funciona si FFmpeg está disponible
3. **Fallback graceful**: La aplicación nunca falla, solo omite la música de fondo
4. **Logs detallados**: Todos los pasos están loggeados para facilitar el debugging

## Contacto

Si tienes problemas con el despliegue, revisa los logs de Render y busca los mensajes de diagnóstico mencionados arriba. 