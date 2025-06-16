require('dotenv').config();
const { db } = require('../config/firebase');

async function fixCurrentUser() {
  try {
    const email = "evavillaro@gmail.com";
    console.log('🔧 Corrigiendo usuario:', email);

    // Buscar usuario por email
    const usersRef = db.collection('users');
    const userQuery = await usersRef.where('email', '==', email).get();
    
    if (userQuery.empty) {
      console.error('❌ Usuario no encontrado');
      return;
    }

    const userDoc = userQuery.docs[0];
    const userRef = userDoc.ref;
    const userData = userDoc.data();

    console.log('👤 Usuario actual:', {
      email: userData.email,
      subscriptionStatus: userData.subscriptionStatus,
      isPremium: userData.isPremium,
      stripeCustomerId: userData.stripeCustomerId
    });

    // Si tiene stripeCustomerId, activar premium
    if (userData.stripeCustomerId) {
      const updateData = {
        subscriptionStatus: 'active',
        isPremium: true,
        updatedAt: new Date()
      };
      
      await userRef.update(updateData);
      
      console.log('✅ Usuario corregido exitosamente:');
      console.log('   - subscriptionStatus: active');
      console.log('   - isPremium: true');
      console.log('   - Stripe Customer ID:', userData.stripeCustomerId);
    } else {
      console.log('⚠️ Usuario no tiene Stripe Customer ID');
    }

  } catch (error) {
    console.error('🔴 Error:', error.message);
  }
}

fixCurrentUser(); 