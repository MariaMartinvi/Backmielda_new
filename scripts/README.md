# 🧹 Scripts de Limpieza de Audio

## cleanup-corrupted-audio.js

Script completo para identificar y eliminar audios corruptos junto con sus datos asociados.

### Características:
- ✅ **Detección inteligente**: Identifica audios corruptos por tamaño, formato y existencia
- ✅ **Limpieza completa**: Elimina audios, imágenes y registros de base de datos
- ✅ **Modo seguro**: Incluye modo dry-run para probar sin eliminar
- ✅ **Confirmación**: Pide confirmación antes de eliminar (salvo modo --force)

### Uso:

```bash
# Análisis sin eliminar nada (recomendado primero)
node scripts/cleanup-corrupted-audio.js --dry-run

# Análisis y limpieza con confirmación
node scripts/cleanup-corrupted-audio.js

# Limpieza automática sin confirmación
node scripts/cleanup-corrupted-audio.js --force
```

### Criterios de detección de audio corrupto:

1. **Audio base64 (tempAudioData)**:
   - Datos vacíos o no válidos
   - Tamaño menor a 1KB
   - Cabeceras MP3 inválidas

2. **Audio en storage (tempAudioPath/audioUrl)**:
   - Archivo no existe en Firebase Storage
   - Tamaño menor a 1KB
   - Errores de acceso

### Lo que elimina:

- 🗑️ **Audio temporal** (`tempAudioData` y archivos en `temp-audio/`)
- 🗑️ **Audio publicado** (archivos en `stories/{id}/`)
- 🗑️ **Imágenes asociadas** (archivos en `stories/{id}/`)
- 🗑️ **Registro completo** de la historia en Firestore

### Ejemplo de salida:

```
🧹 HERRAMIENTA DE LIMPIEZA DE AUDIOS CORRUPTOS
=============================================

🔍 MODO DRY-RUN: Solo se analizará, no se eliminará nada

ℹ️  [2024-01-15T10:30:00.000Z] 🧹 Iniciando limpieza de audios corruptos...
ℹ️  [2024-01-15T10:30:01.000Z] 📊 Total de historias encontradas: 150
🚨 [2024-01-15T10:30:02.000Z] 🚨 AUDIO CORRUPTO DETECTADO: abc123 - Audio too small: 512 bytes

📊 RESUMEN DEL ANÁLISIS:
- Total de historias: 150
- Historias con audio: 45
- Audios corruptos encontrados: 3

🚨 HISTORIAS CON AUDIO CORRUPTO:
1. abc123 - "Cuento del gatito" - Audio too small: 512 bytes
2. def456 - "Historia espacial" - Audio file not found in storage
3. ghi789 - "Sin título" - Invalid MP3 header: 00000000
```

## Seguridad

- ⚠️ **Importante**: Siempre usar `--dry-run` primero para verificar qué se va a eliminar
- 🔄 **Backup**: Considera hacer backup de la base de datos antes de ejecutar
- 🛡️ **Reversible**: Una vez eliminado, no se puede recuperar automáticamente

## Solución de problemas

### Error: "Cannot find module '../config/firebase'"
```bash
# Asegúrate de ejecutar desde el directorio correcto
cd generador-cuentos-backend
node scripts/cleanup-corrupted-audio.js --dry-run
```

### Error: "Permission denied"
```bash
# Verifica que las credenciales de Firebase estén configuradas
export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
``` 