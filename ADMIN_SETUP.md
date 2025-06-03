# 👑 Sistema de Administración AudioGretel

Este documento explica cómo configurar y usar el sistema de usuarios administradores en AudioGretel.

## 🎯 ¿Qué es un usuario Admin?

Un usuario administrador tiene las siguientes características:

- ♾️ **Generación ilimitada de cuentos** (sin límites mensuales)
- 🎵 **Generación ilimitada de audio** 
- 🔓 **Sin restricciones de suscripción**
- 👑 **Privilegios especiales** en el sistema

## 🚀 Crear un Usuario Admin

### Método 1: Script automático (Recomendado)

```bash
# Desde la carpeta del backend
cd generador-cuentos-backend

# Instalar dependencias si no están instaladas
npm install

# Crear usuario admin
node scripts/createAdmin.js admin@audiogretel.com miPasswordSeguro123
```

### Método 2: Actualizar usuario existente

Si ya tienes un usuario registrado y quieres convertirlo en admin:

```bash
# Conectar a MongoDB y actualizar manualmente
# En MongoDB Compass o terminal mongo:
db.users.updateOne(
  { email: "tu-email@ejemplo.com" },
  { $set: { isAdmin: true } }
)
```

## 🔧 Uso del Sistema Admin

### 1. **Login Normal**

El admin hace login normalmente a través de la aplicación web:
- Ve a [audiogretel.com](https://audiogretel.com)
- Inicia sesión con sus credenciales de admin
- El sistema automáticamente detecta que es admin

### 2. **Capacidades del Admin**

Una vez logueado como admin:

- ✅ **Sin límites de generación**: Puede crear todos los cuentos que necesite
- ✅ **No consume créditos**: Los contadores de cuentos no se incrementan
- ✅ **Acceso total**: Todas las funcionalidades disponibles sin restricciones

### 3. **Identificación en el Sistema**

El admin puede identificarse porque:
- En el JWT token tendrá `isAdmin: true`
- En la base de datos tendrá el campo `isAdmin: true`
- Los logs del servidor mostrarán mensajes como "👑 Admin user detected"

## 🛡️ Seguridad

### Recomendaciones de seguridad:

1. **Contraseña fuerte**: Mínimo 8 caracteres, incluye números y símbolos
2. **Email dedicado**: Usa un email específico para admin (ej: admin@audiogretel.com)
3. **Acceso limitado**: Solo comparte las credenciales con personal autorizado
4. **Logs de auditoría**: El sistema registra cuando un admin genera cuentos

### Variables de entorno necesarias:

Asegúrate de que tienes configuradas:

```env
# En tu archivo .env
MONGODB_URI=mongodb://...
JWT_SECRET=tu_jwt_secret_super_seguro
OPENAI_API_KEY=sk-...
```

## 📊 Monitoreo

### Verificar admins existentes

```javascript
// En la consola de MongoDB
db.users.find({ isAdmin: true })
```

### Ver actividad de admin en logs

```bash
# Buscar en logs del servidor
grep "👑 Admin user" logs/app.log
```

## 🔄 Actualización de Frontend

Si necesitas mostrar información especial para admins en el frontend:

```javascript
// En el frontend, verificar si es admin
const user = getCurrentUser();
if (user.isAdmin) {
  // Mostrar interfaz de admin
  // Ej: "Generación ilimitada activada"
}
```

## 🆘 Solución de Problemas

### ❌ Error: "User not found"
- Verifica que el email esté correcto
- Asegúrate de que MongoDB esté conectado

### ❌ Error: "isAdmin is not defined"
- Reinicia el servidor después de actualizar el modelo User
- Verifica que el campo se añadió correctamente a la base de datos

### ❌ Error de conexión a MongoDB
- Verifica la variable MONGODB_URI en el .env
- Asegúrate de que la base de datos esté accesible

## 📝 Comandos Útiles

```bash
# Crear admin
node scripts/createAdmin.js admin@audiogretel.com password123

# Verificar usuario en base de datos
node -e "
const User = require('./models/User');
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const admin = await User.findOne({email: 'admin@audiogretel.com'});
  console.log('Admin found:', admin);
  process.exit(0);
});
"

# Ver logs en tiempo real
tail -f logs/app.log | grep "Admin"
```

## 🎉 ¡Listo!

Una vez configurado el admin, podrás:

1. **Generar cuentos ilimitados** para testing
2. **Crear contenido** sin restricciones  
3. **Probar todas las funcionalidades** del sistema

¡El sistema de admin está listo para usar! 🚀 