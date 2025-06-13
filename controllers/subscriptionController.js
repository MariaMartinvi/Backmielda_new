const { db } = require('../config/firebase');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.cancelSubscription = async (req, res) => {
  try {
    // Get user from Firestore
    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userDoc.data();

    if (!userData.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.cancel(userData.stripeSubscriptionId);

    // Update user in Firestore
    await userRef.update({
      subscriptionStatus: 'cancelled',
      isPremium: false,
      stripeSubscriptionId: null,
      updatedAt: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Subscription cancelled successfully',
      subscriptionStatus: 'cancelled'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ 
      message: 'Error cancelling subscription',
      error: error.message 
    });
  }
}; 