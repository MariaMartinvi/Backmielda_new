const { admin, db } = require('../config/firebase');

// Rate a story
const rateStory = async (req, res) => {
  try {
    // Check if Firebase is initialized
    if (!db) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'Firebase is not configured. Rating system is temporarily disabled.'
      });
    }

    const { storyId } = req.params;
    const { rating } = req.body;
    const { firebaseUser } = req; // From auth middleware

    console.log('🌟 [RATINGS] Rate story request:', {
      storyId,
      rating,
      userEmail: firebaseUser?.email,
      userId: firebaseUser?.uid
    });

    // Validation
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    if (!storyId) {
      return res.status(400).json({
        error: 'Invalid story ID',
        message: 'Story ID is required'
      });
    }

    if (!firebaseUser) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to rate stories'
      });
    }

    // Check if story exists
    const storyRef = db.collection('storyExamples').doc(storyId);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      return res.status(404).json({
        error: 'Story not found',
        message: 'The specified story does not exist'
      });
    }

    // Create or update rating
    const ratingRef = db.collection('ratings').doc(`${storyId}_${firebaseUser.uid}`);
    const ratingData = {
      storyId,
      userId: firebaseUser.uid,
      userEmail: firebaseUser.email,
      rating: parseInt(rating),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Check if rating already exists
    const existingRating = await ratingRef.get();
    if (existingRating.exists) {
      await ratingRef.update({
        rating: parseInt(rating),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ [RATINGS] Rating updated');
    } else {
      await ratingRef.set(ratingData);
      console.log('✅ [RATINGS] New rating created');
    }

    // Calculate new average rating for the story
    const ratingsSnapshot = await db.collection('ratings')
      .where('storyId', '==', storyId)
      .get();

    let totalRating = 0;
    const totalRatings = ratingsSnapshot.size;

    ratingsSnapshot.forEach(doc => {
      totalRating += doc.data().rating;
    });

    const averageRating = totalRatings > 0 ? (totalRating / totalRatings) : 0;

    // Update story with average rating
    await storyRef.update({
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: totalRatings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`📊 [RATINGS] Story ${storyId} average rating: ${averageRating} (${totalRatings} ratings)`);

    res.json({
      success: true,
      message: 'Rating saved successfully',
      data: {
        storyId,
        userRating: parseInt(rating),
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings
      }
    });

  } catch (error) {
    console.error('❌ [RATINGS] Error rating story:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to save rating'
    });
  }
};

// Get story ratings
const getStoryRatings = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { firebaseUser } = req;

    console.log('📊 [RATINGS] Get story ratings:', storyId);

    // Get story data
    const storyRef = db.collection('storyExamples').doc(storyId);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      return res.status(404).json({
        error: 'Story not found',
        message: 'The specified story does not exist'
      });
    }

    const storyData = storyDoc.data();
    
    // Get user's rating if authenticated
    let userRating = null;
    if (firebaseUser) {
      const userRatingRef = db.collection('ratings').doc(`${storyId}_${firebaseUser.uid}`);
      const userRatingDoc = await userRatingRef.get();
      
      if (userRatingDoc.exists) {
        userRating = userRatingDoc.data().rating;
      }
    }

    res.json({
      success: true,
      data: {
        storyId,
        averageRating: storyData.averageRating || 0,
        totalRatings: storyData.totalRatings || 0,
        userRating
      }
    });

  } catch (error) {
    console.error('❌ [RATINGS] Error getting story ratings:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get story ratings'
    });
  }
};

// Get top rated stories
const getTopRatedStories = async (req, res) => {
  try {
    const { limit = 10, minRatings = 1 } = req.query;

    console.log('🏆 [RATINGS] Get top rated stories:', { limit, minRatings });

    // Get stories with ratings, ordered by average rating
    const storiesSnapshot = await db.collection('storyExamples')
      .where('totalRatings', '>=', parseInt(minRatings))
      .orderBy('averageRating', 'desc')
      .limit(parseInt(limit))
      .get();

    const topStories = [];
    storiesSnapshot.forEach(doc => {
      const data = doc.data();
      topStories.push({
        id: doc.id,
        title: data.title,
        averageRating: data.averageRating || 0,
        totalRatings: data.totalRatings || 0,
        age: data.age,
        language: data.language,
        level: data.level,
        imagePath: data.imagePath,
        audioPath: data.audioPath,
        textPath: data.textPath
      });
    });

    res.json({
      success: true,
      data: topStories,
      count: topStories.length
    });

  } catch (error) {
    console.error('❌ [RATINGS] Error getting top rated stories:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get top rated stories'
    });
  }
};

module.exports = {
  rateStory,
  getStoryRatings,
  getTopRatedStories
}; 