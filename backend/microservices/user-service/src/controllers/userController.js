const Joi = require('joi');
const db = require('../services/database');

// Validation schemas
const createUserSchema = Joi.object({
  codeforcesHandle: Joi.string().required(),
  rating: Joi.number().integer().min(0).max(4000).default(0)
});

const updateRatingSchema = Joi.object({
  rating: Joi.number().integer().min(0).max(4000).required()
});

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
      const { error, value } = updateRatingSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { rating } = value;

      const user = await db.updateUserRating(req.userId, rating);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
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