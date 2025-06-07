const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'es'
  },
  ageGroup: {
    type: String,
    default: '3to5'
  },
  englishLevel: {
    type: String,
    default: null
  },
  spanishLevel: {
    type: String,
    default: null
  },
  storyType: {
    type: String,
    default: 'original'
  },
  storyLength: {
    type: String,
    default: 'medium'
  },
  childNames: {
    type: String,
    default: null
  },
  audioGenerations: {
    type: Number,
    default: 0,
    max: 2
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  published: {
    type: Boolean,
    default: false
  },
  audioPath: {
    type: String,
    default: null
  },
  textPath: {
    type: String,
    default: null
  },
  imagePath: {
    type: String,
    default: null
  },
  // Rating system fields
  ratings: [{
    user: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  }
});

// Method to check if audio can be generated
storySchema.methods.canGenerateAudio = function() {
  return this.audioGenerations < 2;
};

// Method to increment audio generations
storySchema.methods.incrementAudioGenerations = function() {
  if (this.canGenerateAudio()) {
    this.audioGenerations += 1;
    return true;
  }
  return false;
};

// Method to add or update rating
storySchema.methods.addRating = function(userId, email, rating) {
  // Check if user already rated this story
  const existingRatingIndex = this.ratings.findIndex(r => r.user === userId);
  
  if (existingRatingIndex !== -1) {
    // Update existing rating
    this.ratings[existingRatingIndex].rating = rating;
    this.ratings[existingRatingIndex].createdAt = new Date();
  } else {
    // Add new rating
    this.ratings.push({
      user: userId,
      email: email,
      rating: rating
    });
  }
  
  // Recalculate average rating
  this.calculateAverageRating();
  
  return this;
};

// Method to calculate average rating
storySchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = Math.round((sum / this.ratings.length) * 10) / 10; // Round to 1 decimal
    this.totalRatings = this.ratings.length;
  }
  
  return this;
};

// Method to get user's rating for this story
storySchema.methods.getUserRating = function(userId) {
  const userRating = this.ratings.find(r => r.user === userId);
  return userRating ? userRating.rating : null;
};

module.exports = mongoose.model('Story', storySchema); 