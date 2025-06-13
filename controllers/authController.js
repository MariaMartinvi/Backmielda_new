// Firebase-only Authentication Controller
// MongoDB removed - using Firestore exclusively  
// Updated: ${new Date().toISOString()}

const { db } = require('../config/firebase');

/**
 * Get user profile from Firestore
 */
const getProfile = async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const userData = userDoc.data();
    
    res.json({
      success: true,
      user: {
        uid: req.user.uid,
        email: userData.email,
        emailVerified: userData.emailVerified,
        subscriptionStatus: userData.subscriptionStatus,
        isPremium: userData.isPremium,
        isAdmin: userData.isAdmin,
        storiesGenerated: userData.storiesGenerated,
        monthlyStoriesGenerated: userData.monthlyStoriesGenerated
      }
    });
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

/**
 * Update user profile in Firestore
 */
const updateProfile = async (req, res) => {
  try {
    const { email } = req.body;
    const userRef = db.collection('users').doc(req.user.uid);
    
    const updateData = {
      email,
      updatedAt: new Date()
    };
    
    await userRef.update(updateData);
    
    res.json({
      success: true,
      message: 'Perfil actualizado correctamente'
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

/**
 * Get user subscription status from Firestore
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const userData = userDoc.data();
    
    res.json({
      success: true,
      subscriptionStatus: userData.subscriptionStatus || 'free',
      isPremium: userData.isPremium || false,
      storiesGenerated: userData.storiesGenerated || 0,
      monthlyStoriesGenerated: userData.monthlyStoriesGenerated || 0
    });
    
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getSubscriptionStatus
}; 