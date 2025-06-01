const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No active subscription found' });
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    // Update user in database
    user.subscriptionStatus = 'cancelled';
    user.isPremium = false;
    user.stripeSubscriptionId = null;
    await user.save();

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