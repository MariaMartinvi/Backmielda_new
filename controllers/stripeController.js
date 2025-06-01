const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// Crear sesión de checkout
const createCheckoutSession = async (req, res) => {
  try {
    const { email } = req.body;
    console.log('🔍 DEBUG CHECKOUT: Creando sesión para', email);
    console.log('🔍 DEBUG CHECKOUT: Variables de entorno', {
      STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
      FRONTEND_URL: process.env.FRONTEND_URL
    });
    
    if (!email) {
      return res.status(400).json({ error: 'Email es requerido' });
    }
    
    // Buscar o crear usuario
    let user = await User.findOne({ email });
    
    if (!user) {
      console.log('🔍 DEBUG CHECKOUT: Usuario no encontrado, creando nuevo');
      user = await User.create({ 
        email, 
        subscriptionStatus: 'free',
        storiesRemaining: 5 
      });
    }
    
    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscribe`,
      customer_email: email,
      client_reference_id: user._id.toString(),
      metadata: {
        userId: user._id.toString()
      }
    });
    
    console.log('🟢 DEBUG CHECKOUT: Sesión creada', {
      sessionId: session.id,
      url: session.url
    });
    
    res.json({ 
      id: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('🔴 DEBUG CHECKOUT: Error creando sesión', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: error.message });
  }
};

// Manejar éxito de pago
const handleSuccess = async (req, res) => {
  console.log('🔍 DEBUG SUCCESS: Inicio del método');
  console.log('🔍 DEBUG SUCCESS: Query recibida', req.query);
  
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      console.log('🔴 DEBUG SUCCESS: No se proporcionó ID de sesión');
      return res.status(400).json({ error: 'ID de sesión requerido' });
    }
    
    // Recuperar sesión de Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['customer', 'line_items', 'subscription']
    });
    
    console.log('🟢 DEBUG SUCCESS: Detalles de sesión', {
      id: session.id,
      payment_status: session.payment_status,
      customer: session.customer,
      client_reference_id: session.client_reference_id
    });

    // Verificar estado de pago
    if (session.payment_status !== 'paid') {
      console.log('🔴 DEBUG SUCCESS: Pago no completado', session.payment_status);
      return res.status(400).json({ error: 'Pago no completado' });
    }

    // Buscar usuario
    const userId = session.client_reference_id;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log(`🔴 DEBUG SUCCESS: Usuario no encontrado con ID: ${userId}`);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('🔍 DEBUG SUCCESS: Usuario antes de actualizar', {
      email: user.email,
      subscriptionStatus: user.subscriptionStatus
    });

    // Actualizar información de usuario
    user.subscriptionStatus = 'active';
    user.stripeCustomerId = session.customer;
    user.stripeSubscriptionId = session.subscription;
    user.storiesRemaining = 30;

    await user.save();

    console.log('🟢 DEBUG SUCCESS: Usuario después de actualizar', {
      email: user.email,
      subscriptionStatus: user.subscriptionStatus
    });

    res.json({
      success: true,
      message: 'Suscripción activada exitosamente',
      user: {
        id: user._id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        storiesRemaining: user.storiesRemaining
      }
    });
  } catch (error) {
    console.error('🔴 DEBUG SUCCESS: Error completo', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
};

// Manejar webhook de Stripe
const handleWebhook = async (req, res) => {
  console.log('🚨 WEBHOOK ULTRA DEBUG: MÉTODO INVOCADO');
  console.log('🔍 DETALLES DE LA SOLICITUD:', {
    method: req.method,
    url: req.url,
    headers: JSON.stringify(req.headers, null, 2),
    body: req.body ? JSON.stringify(req.body, null, 2) : 'No body'
  });

  const sig = req.headers['stripe-signature'];
  console.log('🔍 STRIPE SIGNATURE:', sig);
  console.log('🔍 WEBHOOK SECRET:', 
    process.env.STRIPE_WEBHOOK_SECRET ? 
    'Secret presente' : 
    'Secret NO configurado'
  );

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('🔴 ERROR: STRIPE_WEBHOOK_SECRET no configurado');
    return res.status(500).json({ error: 'Webhook secret no configurado' });
  }

  if (!sig) {
    console.error('🔴 ERROR: No se recibió la firma de Stripe');
    return res.status(400).json({ error: 'No se recibió la firma de Stripe' });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log('🟢 WEBHOOK EVENT RECIBIDO:', {
      type: event.type,
      id: event.id,
      data: JSON.stringify(event.data, null, 2)
    });

    // Manejar el evento checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('🟢 CHECKOUT SESSION COMPLETED:', {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        clientReferenceId: session.client_reference_id
      });

      // Buscar usuario por el ID de referencia del cliente
      const user = await User.findById(session.client_reference_id);
      if (!user) {
        console.error('🔴 ERROR: Usuario no encontrado');
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Actualizar estado de suscripción
      user.subscriptionStatus = 'active';
      user.stripeCustomerId = session.customer;
      user.stripeSubscriptionId = session.subscription;
      user.storiesRemaining = 30;
      await user.save();

      console.log('🟢 USUARIO ACTUALIZADO:', {
        email: user.email,
        subscriptionStatus: user.subscriptionStatus
      });
    }

    // Manejar el evento customer.subscription.created
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object;
      console.log('🟢 CUSTOMER SUBSCRIPTION CREATED:', {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status
      });

      // Buscar usuario por el ID del cliente de Stripe
      const user = await User.findOne({ stripeCustomerId: subscription.customer });
      if (!user) {
        console.log('🔴 USUARIO NO ENCONTRADO PARA EL CLIENTE:', subscription.customer);
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Actualizar estado de suscripción
      user.subscriptionStatus = subscription.status;
      user.isPremium = true;
      user.stripeSubscriptionId = subscription.id;
      user.storiesRemaining = 30;

      await user.save();
      console.log('🟢 USUARIO ACTUALIZADO:', {
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        isPremium: user.isPremium,
        storiesRemaining: user.storiesRemaining
      });
    }

    // Manejar el evento customer.subscription.deleted
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      console.log('🟢 SUBSCRIPTION DELETED:', {
        subscriptionId: subscription.id,
        customerId: subscription.customer
      });

      // Buscar usuario por el ID de cliente de Stripe
      const user = await User.findOne({ stripeCustomerId: subscription.customer });
      if (!user) {
        console.error('🔴 ERROR: Usuario no encontrado');
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Actualizar estado de suscripción
      user.subscriptionStatus = 'cancelled';
      user.stripeSubscriptionId = null;
      user.isPremium = false;
      await user.save();

      console.log('🟢 USUARIO ACTUALIZADO:', {
        email: user.email,
        subscriptionStatus: user.subscriptionStatus
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('🔴 ERROR EN WEBHOOK:', {
      message: err.message,
      stack: err.stack
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

// Exportar todos los controladores
module.exports = {
  createCheckoutSession,
  handleSuccess,
  handleWebhook
};