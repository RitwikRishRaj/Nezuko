const Joi = require('joi');
const db = require('../services/database');
const axios = require('axios');

// Validation schemas
const createUserSchema = Joi.object({
  codeforcesHandle: Joi.string().required(),
  rating: Joi.number().integer().min(0).max(4000).default(0)
});

const updateRatingSchema = Joi.object({}).unknown(true);

class UserController {
  async createUser(req, res, next) {
    try {
      const { error, value } = createUserSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { codeforcesHandle, rating } = value;

      const userData = {
        clerk_id: req.userId,
        codeforces_handle: codeforcesHandle,
        codeforces_rating: rating,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if user already exists
      const existingUser = await db.getUserByClerkId(req.userId);
      
      let user;
      if (existingUser) {
        // Update existing user
        user = await db.updateUser(req.userId, {
          codeforces_handle: codeforcesHandle,
          codeforces_rating: rating,
          is_verified: true
        });
      } else {
        // Create new user
        user = await db.createUser(userData);
      }

      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  async getUserDetails(req, res, next) {
    try {
      const { clerkId } = req.query;

      if (!clerkId) {
        return res.status(400).json({ error: 'Clerk ID is required' });
      }

      const user = await db.getUserByClerkId(clerkId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async searchUsers(req, res, next) {
    try {
      const { handle } = req.query;

      if (!handle || handle.trim().length < 2) {
        return res.status(400).json({ 
          error: 'Search query must be at least 2 characters', 
          users: [] 
        });
      }

      const users = await db.searchUsersByHandle(handle.trim());

      res.json({ 
        users: users || [],
        count: users?.length || 0,
        searchTerm: handle.trim()
      });
    } catch (err) {
      next(err);
    }
  }

  async updateRating(req, res, next) {
    try {
      console.log('UpdateRating called for user:', req.userId);
      
      const { error, value } = updateRatingSchema.validate(req.body || {});
      if (error) {
        console.error('Validation error:', error.details[0].message);
        return res.status(400).json({ error: error.details[0].message });
      }

      // Get current user to fetch their Codeforces handle
      console.log('Fetching user from database...');
      const currentUser = await db.getUserByClerkId(req.userId);
      console.log('Current user:', currentUser);
      
      if (!currentUser) {
        console.log('User not found in database');
        return res.status(404).json({ error: 'User not found. Please verify your Codeforces handle first.' });
      }
      
      if (!currentUser.codeforces_handle) {
        console.log('User has no Codeforces handle');
        return res.status(404).json({ error: 'No Codeforces handle set. Please verify your handle first.' });
      }

      let newRating = req.body?.rating;
      
      // If no rating provided, fetch from Codeforces API
      if (newRating === undefined) {
        console.log('Fetching rating from Codeforces for handle:', currentUser.codeforces_handle);
        try {
          const cfResponse = await axios.get(
            `https://codeforces.com/api/user.info?handles=${currentUser.codeforces_handle}`,
            {
              timeout: 10000, // 10 second timeout
              headers: {
                'User-Agent': 'AlgoGym-UserService/1.0'
              }
            }
          );
          const cfData = cfResponse.data;
          
          if (cfData.status === 'OK' && cfData.result && cfData.result.length > 0) {
            newRating = cfData.result[0].rating || 0;
            console.log('Fetched rating from Codeforces:', newRating);
          } else {
            newRating = 0; // Default rating if not found
            console.log('No rating found on Codeforces, using default: 0');
          }
        } catch (fetchError) {
          console.error('Error fetching Codeforces rating:', fetchError.message);
          
          if (fetchError.code === 'ECONNABORTED') {
            console.log('Codeforces API timeout, keeping current rating');
          } else if (fetchError.response && fetchError.response.status === 429) {
            console.log('Codeforces API rate limit, keeping current rating');
          }
          
          newRating = currentUser.codeforces_rating || 0; // Keep current rating if fetch fails
          console.log('Using current rating due to fetch error:', newRating);
        }
      }

      const previousRating = currentUser.codeforces_rating || 0;
      const updated = newRating !== previousRating;
      
      console.log('Rating update:', { previousRating, newRating, updated });

      // Update the rating in database
      console.log('Updating rating in database...');
      const user = await db.updateUserRating(req.userId, newRating);
      console.log('Database update successful:', user);
      
      res.json({ 
        success: true, 
        user,
        updated,
        rating: newRating,
        previousRating
      });
    } catch (err) {
      console.error('UpdateRating error:', err);
      res.status(500).json({ error: 'Database operation failed: ' + err.message });
    }
  }

  async checkUserExists(req, res, next) {
    try {
      const { clerkId } = req.query;

      if (!clerkId) {
        return res.status(400).json({ error: 'Clerk ID is required' });
      }

      const exists = await db.checkUserExists(clerkId);
      res.json({ exists });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();