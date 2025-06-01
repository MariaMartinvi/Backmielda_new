const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: false
  },
  googleId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  storiesGenerated: {
    type: Number,
    default: 0
  },
  monthlyStoriesGenerated: {
    type: Number,
    default: 0
  },
  lastMonthReset: {
    type: Date,
    default: Date.now
  },
  subscriptionStatus: {
    type: String,
    enum: ['free', 'active', 'cancelled'],
    default: 'free'
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  subscriptionEndDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to check and reset monthly count if needed
userSchema.methods.checkAndResetMonthlyCount = function() {
  const now = new Date();
  const lastReset = this.lastMonthReset;
  
  if (lastReset && (
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear()
  )) {
    this.monthlyStoriesGenerated = 0;
    this.lastMonthReset = now;
  }
};

// Method to check if user can generate more stories
userSchema.methods.canGenerateStory = function() {
  if (this.subscriptionStatus === 'active') {
    return true;
  }
  return this.storiesGenerated < 3;
};

module.exports = mongoose.model('User', userSchema); 