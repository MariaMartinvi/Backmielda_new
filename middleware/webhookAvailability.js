const webhookAvailabilityCheck = (req, res, next) => {
    console.log('🚨 WEBHOOK MIDDLEWARE: INICIO DE VERIFICACIÓN');
    console.log('🔍 DETALLES DE LA SOLICITUD:', {
      method: req.method,
      url: req.url,
      headers: JSON.stringify(req.headers, null, 2)
    });
  
    // Log del cuerpo de la solicitud
    if (req.body) {
      console.log('📦 CUERPO DE LA SOLICITUD:', req.body.toString('utf8').slice(0, 500));
    } else {
      console.log('⚠️ NO HAY CUERPO EN LA SOLICITUD');
    }
  
    // Verificaciones adicionales
    if (req.method !== 'POST') {
      console.log('❌ MÉTODO NO PERMITIDO');
      return res.status(405).json({ error: 'Método no permitido' });
    }
  
    // Si hay firma de Stripe, procesar webhook
    if (req.headers['stripe-signature']) {
      console.log('🔍 FIRMA DE STRIPE DETECTADA');
      return next();
    }
  
    // Si no hay firma de Stripe, devolver error
    console.log('❌ NO SE DETECTÓ FIRMA DE STRIPE');
    return res.status(400).json({ error: 'No se detectó firma de Stripe' });
};
  
module.exports = webhookAvailabilityCheck;