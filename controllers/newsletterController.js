const NewsletterSubscription = require('../models/NewsletterSubscription');

exports.subscribe = async (req, res) => {
  console.log('Newsletter subscribe request received:', req.body);
  
  try {
    const { email } = req.body;

    if (!email) {
      console.log('No email provided in request');
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    console.log('Checking for existing subscription for:', email);
    // Verificar si el email ya está suscrito
    const existingSubscription = await NewsletterSubscription.findOne({ email });
    
    if (existingSubscription) {
      console.log('Found existing subscription:', existingSubscription);
      if (existingSubscription.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Este email ya está suscrito a la newsletter'
        });
      } else {
        // Reactivar suscripción existente
        console.log('Reactivating existing subscription');
        existingSubscription.isActive = true;
        await existingSubscription.save();
        return res.status(200).json({
          success: true,
          message: 'Suscripción reactivada exitosamente'
        });
      }
    }

    // Crear nueva suscripción
    console.log('Creating new subscription for:', email);
    const subscription = new NewsletterSubscription({ email });
    await subscription.save();
    console.log('New subscription created successfully');

    res.status(201).json({
      success: true,
      message: 'Suscripción exitosa a la newsletter'
    });
  } catch (error) {
    console.error('Error en la suscripción a la newsletter:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al procesar la suscripción'
    });
  }
};

exports.unsubscribe = async (req, res) => {
  console.log('Newsletter unsubscribe request received:', req.body);
  
  try {
    const { email } = req.body;

    if (!email) {
      console.log('No email provided in unsubscribe request');
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    console.log('Looking for subscription to unsubscribe:', email);
    const subscription = await NewsletterSubscription.findOne({ email });
    
    if (!subscription) {
      console.log('No subscription found for:', email);
      return res.status(404).json({
        success: false,
        message: 'No se encontró la suscripción'
      });
    }

    console.log('Found subscription, marking as inactive');
    subscription.isActive = false;
    await subscription.save();
    console.log('Subscription marked as inactive successfully');

    res.status(200).json({
      success: true,
      message: 'Suscripción cancelada exitosamente'
    });
  } catch (error) {
    console.error('Error al cancelar la suscripción:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al procesar la cancelación'
    });
  }
}; 