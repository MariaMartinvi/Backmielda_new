const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { admin, db } = require('../config/firebase');

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
    
    // Buscar usuario en Firestore
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', email).get();
    
    let user;
    let userId;
    
    if (userQuery.empty) {
      console.log('🔍 DEBUG CHECKOUT: Usuario no encontrado, creando nuevo');
      // Crear nuevo usuario en Firestore
      const newUserData = {
        email, 
        subscriptionStatus: 'free',
        storiesGenerated: 0,
        monthlyStoriesGenerated: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const userDocRef = await usersRef.add(newUserData);
      userId = userDocRef.id;
      user = { id: userId, ...newUserData };
    } else {
      const userDoc = userQuery.docs[0];
      userId = userDoc.id;
      user = { id: userId, ...userDoc.data() };
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
      client_reference_id: userId,
      metadata: {
        userId: userId,
        email: email
      }
    });
    
    console.log('🟢 DEBUG CHECKOUT: Sesión creada', {
      sessionId: session.id,
      url: session.url,
      userId: userId
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

    // Buscar usuario en Firestore
    const userId = session.client_reference_id;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log(`🔴 DEBUG SUCCESS: Usuario no encontrado con ID: ${userId}`);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userData = userDoc.data();
    console.log('🔍 DEBUG SUCCESS: Usuario antes de actualizar', {
      email: userData.email,
      subscriptionStatus: userData.subscriptionStatus
    });

    // Actualizar información de usuario en Firestore
    const updateData = {
      subscriptionStatus: 'active',
      isPremium: true,  // ✅ CAMPO CRÍTICO AÑADIDO
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
      monthlyStoriesGenerated: 0, // Reset monthly count when subscription becomes active
      lastMonthReset: new Date(),
      subscriptionStartDate: new Date(),
      updatedAt: new Date()
    };

    await userRef.update(updateData);

    console.log('🟢 DEBUG SUCCESS: Usuario después de actualizar', {
      email: userData.email,
      subscriptionStatus: 'active'
    });

    res.json({
      success: true,
      message: 'Suscripción activada exitosamente',
      user: {
        id: userId,
        email: userData.email,
        subscriptionStatus: 'active',
        ...updateData
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

      // Buscar usuario en Firestore por ID
      const userId = session.client_reference_id;
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.error('🔴 ERROR: Usuario no encontrado con ID:', userId);
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Actualizar estado de suscripción
      const updateData = {
        subscriptionStatus: 'active',
        isPremium: true,  // ✅ CAMPO CRÍTICO AÑADIDO
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        monthlyStoriesGenerated: 0,
        lastMonthReset: new Date(),
        subscriptionStartDate: new Date(),
        updatedAt: new Date()
      };
      
      await userRef.update(updateData);

      const userData = userDoc.data();
      console.log('🟢 USUARIO ACTUALIZADO:', {
        email: userData.email,
        subscriptionStatus: 'active'
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
      const usersRef = db.collection('users');
      const userQuery = await usersRef.where('stripeCustomerId', '==', subscription.customer).get();
      
      if (userQuery.empty) {
        console.log('🔴 USUARIO NO ENCONTRADO PARA EL CLIENTE:', subscription.customer);
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const userDoc = userQuery.docs[0];
      const userRef = userDoc.ref;
      const userData = userDoc.data();

      // Actualizar estado de suscripción
      const updateData = {
        subscriptionStatus: subscription.status,
        isPremium: subscription.status === 'active',  // ✅ CAMPO CRÍTICO AÑADIDO
        stripeSubscriptionId: subscription.id,
        monthlyStoriesGenerated: 0,
        lastMonthReset: new Date(),
        updatedAt: new Date()
      };

      await userRef.update(updateData);
      
      console.log('🟢 USUARIO ACTUALIZADO:', {
        email: userData.email,
        subscriptionStatus: subscription.status,
        stripeSubscriptionId: subscription.id
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
      const usersRef = db.collection('users');
      const userQuery = await usersRef.where('stripeCustomerId', '==', subscription.customer).get();
      
      if (userQuery.empty) {
        console.error('🔴 ERROR: Usuario no encontrado');
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const userDoc = userQuery.docs[0];
      const userRef = userDoc.ref;
      const userData = userDoc.data();

      // Actualizar estado de suscripción
      const updateData = {
        subscriptionStatus: 'cancelled',
        isPremium: false,  // ✅ CAMPO CRÍTICO AÑADIDO
        stripeSubscriptionId: null,
        subscriptionEndDate: new Date(),
        updatedAt: new Date()
      };
      
      await userRef.update(updateData);

      console.log('🟢 USUARIO ACTUALIZADO:', {
        email: userData.email,
        subscriptionStatus: 'cancelled'
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

// Función para corregir manualmente un usuario premium
const fixPremiumUser = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requerido' });
    }

    console.log('🔧 CORRIGIENDO USUARIO PREMIUM:', email);

    // Buscar usuario por email
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', email).get();
    
    if (userQuery.empty) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const userDoc = userQuery.docs[0];
    const userRef = userDoc.ref;
    const userData = userDoc.data();

    console.log('👤 USUARIO ENCONTRADO:', {
      email: userData.email,
      currentStatus: userData.subscriptionStatus,
      currentPremium: userData.isPremium,
      stripeCustomerId: userData.stripeCustomerId
    });

    // Si tiene stripeCustomerId, significa que pagó
    if (userData.stripeCustomerId) {
      const updateData = {
        subscriptionStatus: 'active',
        isPremium: true,
        updatedAt: new Date()
      };
      
      await userRef.update(updateData);
      
      console.log('✅ USUARIO CORREGIDO:', {
        email: userData.email,
        subscriptionStatus: 'active',
        isPremium: true
      });

      res.json({
        success: true,
        message: 'Usuario corregido exitosamente',
        user: {
          email: userData.email,
          subscriptionStatus: 'active',
          isPremium: true,
          stripeCustomerId: userData.stripeCustomerId
        }
      });
    } else {
      res.status(400).json({ 
        error: 'Usuario no tiene Stripe Customer ID - no ha pagado' 
      });
    }
  } catch (error) {
    console.error('🔴 ERROR CORRIGIENDO USUARIO:', error);
    res.status(500).json({ error: error.message });
  }
};

// Exportar todos los controladores
module.exports = {
  createCheckoutSession,
  handleSuccess,
  handleWebhook,
  fixPremiumUser
};