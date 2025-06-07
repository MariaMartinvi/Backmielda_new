const { db } = require('../config/firebase');

class StoryService {
  constructor() {
    this.collection = db.collection('stories');
  }

  // Create a new story
  async create(storyData) {
    try {
      // Add server timestamp
      const docData = {
        ...storyData,
        createdAt: new Date(),
        updatedAt: new Date(),
        audioGenerations: 0,
        published: false,
        averageRating: 0,
        totalRatings: 0,
        ratings: []
      };

      const docRef = await this.collection.add(docData);
      
      // Return the created story with ID
      return {
        id: docRef.id,
        _id: docRef.id, // For compatibility with existing code
        ...docData,
        toObject: () => ({ id: docRef.id, _id: docRef.id, ...docData })
      };
    } catch (error) {
      console.error('Error creating story in Firestore:', error);
      throw error;
    }
  }

  // Find story by ID
  async findById(storyId) {
    try {
      const doc = await this.collection.doc(storyId).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return {
        id: doc.id,
        _id: doc.id,
        ...data,
        // Add methods for compatibility
        canGenerateAudio: function() {
          return (this.audioGenerations || 0) < 2;
        },
        incrementAudioGenerations: function() {
          if (this.canGenerateAudio()) {
            this.audioGenerations = (this.audioGenerations || 0) + 1;
            return true;
          }
          return false;
        },
        save: async function() {
          await db.collection('stories').doc(this.id).update({
            audioGenerations: this.audioGenerations,
            updatedAt: new Date()
          });
          return this;
        },
        toObject: function() {
          return { id: this.id, _id: this.id, ...data };
        }
      };
    } catch (error) {
      console.error('Error finding story by ID:', error);
      throw error;
    }
  }

  // Find stories by email
  async findByEmail(email, options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      
      // Simple query without orderBy to avoid composite index requirement
      let query = this.collection.where('email', '==', email);
      
      const snapshot = await query.get();
      
      // Convert to array and sort in memory
      const stories = [];
      snapshot.forEach(doc => {
        stories.push({
          id: doc.id,
          _id: doc.id,
          ...doc.data(),
          toObject: function() {
            return { id: doc.id, _id: doc.id, ...doc.data() };
          }
        });
      });

      // Sort in memory
      stories.sort((a, b) => {
        if (sortBy === 'createdAt') {
          const dateA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const dateB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        }
        // Add other sorting fields if needed
        return 0;
      });

      // Apply pagination
      const totalStories = stories.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + parseInt(limit);
      const paginatedStories = stories.slice(startIndex, endIndex);

      return {
        stories: paginatedStories,
        totalStories,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(totalStories / limit),
          totalStories,
          hasNext: endIndex < totalStories,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error finding stories by email:', error);
      throw error;
    }
  }

  // Find published stories
  async findPublished(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      let query = this.collection.where('published', '==', true);
      query = query.orderBy('averageRating', 'desc')
                   .orderBy('totalRatings', 'desc')
                   .orderBy('createdAt', 'desc');
      
      const offset = (page - 1) * limit;
      if (offset > 0) {
        query = query.offset(offset);
      }
      query = query.limit(parseInt(limit));

      const snapshot = await query.get();
      
      const stories = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        stories.push({
          id: doc.id,
          _id: doc.id,
          ...data,
          toObject: function() {
            return { id: doc.id, _id: doc.id, ...data };
          }
        });
      });

      // Get total count
      const totalSnapshot = await this.collection.where('published', '==', true).get();
      const totalStories = totalSnapshot.size;

      return {
        stories,
        totalStories,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(totalStories / limit),
          totalStories,
          hasNext: page * limit < totalStories,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error finding published stories:', error);
      throw error;
    }
  }

  // Update story
  async update(storyId, updateData) {
    try {
      await this.collection.doc(storyId).update({
        ...updateData,
        updatedAt: new Date()
      });
      
      return await this.findById(storyId);
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  }

  // Count documents with filter
  async countDocuments(filter = {}) {
    try {
      let query = this.collection;
      
      // Apply filters
      Object.keys(filter).forEach(key => {
        query = query.where(key, '==', filter[key]);
      });
      
      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      console.error('Error counting documents:', error);
      throw error;
    }
  }
}

module.exports = new StoryService(); 