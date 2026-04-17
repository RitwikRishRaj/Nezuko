const Joi = require('joi');
const db = require('../services/database');
const ratingCalculator = require('../services/ratingCalculator');

// Validation schemas
const addPointsSchema = Joi.object({
  userId: Joi.string().required(),
  points: Joi.number().integer().min(-10000).max(10000).required(),
  reason: Joi.string().required(),
  metadata: Joi.object().default({})
});

const calculateRatingSchema = Joi.object({
  participants: Joi.array().items(Joi.object({
    userId: Joi.string().required(),
    currentRating: Joi.number().integer().min(0).max(4000).required(),
    cfRating: Joi.number().integer().min(0).max(4000).required(),
    rank: Joi.number().integer().min(1).optional(), // Optional for team mode
    teamType: Joi.string().valid('host', 'opponent').optional(), // For team vs team
    finalScore: Joi.number().min(0).default(0), // Final score for the participant
    submissions: Joi.array().items(Joi.object({
      problemId: Joi.string().required(),
      submissionTime: Joi.number().required(), // timestamp
      status: Joi.string().required(), // 'accepted', 'wrong_answer', etc.
      score: Joi.number().min(0).default(0) // for IOI format
    })).required()
  })).min(2).required(),
  format: Joi.string().valid('icpc', 'ioi', 'long').required(),
  roomMode: Joi.string().valid('1v1', 'team-vs-team').default('1v1')
});

class PointsController {
  // Get user rating
  async getUserRating(req, res, next) {
    try {
      const userId = req.params.userId || req.userId;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      let rating = await db.getUserRating(userId);
      
      if (!rating) {
        // Create initial rating record
        const initialRating = {
          user_id: userId,
          current_rating: 1200,
          peak_rating: 1200,
          codeforces_rating: 0,
          contests_participated: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        rating = await db.createOrUpdateUserRating(initialRating);
      }

      res.json({ rating });
    } catch (err) {
      next(err);
    }
  }

  // Get user points
  async getUserPoints(req, res, next) {
    try {
      const userId = req.params.userId || req.userId;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const points = await db.getUserPoints(userId);
      
      if (!points) {
        // Create initial points record
        const initialPoints = {
          user_id: userId,
          total_points: 0,
          arena_points: 0,
          practice_points: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const newPoints = await db.createOrUpdateUserPoints(initialPoints);
        return res.json({ points: newPoints });
      }

      res.json({ points });
    } catch (err) {
      next(err);
    }
  }

  // Add points to user
  async addPoints(req, res, next) {
    try {
      const { error, value } = addPointsSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { userId, points, reason, metadata } = value;

      console.log('Adding points:', { userId, points, reason, metadata });
      
      const result = await db.addPoints(userId, points, reason, metadata);
      
      res.json({ 
        success: true, 
        points: result.updatedPoints,
        transaction: result.transaction
      });
    } catch (err) {
      next(err);
    }
  }

  // Calculate rating changes for session participants
  async calculateRatings(req, res, next) {
    try {
      const { error, value } = calculateRatingSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { participants, format, roomMode } = value;

      console.log('Calculating ratings for session:', { 
        participantCount: participants.length, 
        format,
        roomMode
      });

      const ratingChanges = ratingCalculator.calculateSessionRatings(participants, format, roomMode);

      res.json({
        success: true,
        format,
        roomMode,
        ratingChanges,
        summary: {
          participantCount: participants.length,
          avgRatingChange: Math.round(
            ratingChanges.reduce((sum, p) => sum + (p.averageRatingChange || p.ratingChange), 0) / ratingChanges.length
          )
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // Calculate individual rating change between two players
  async calculatePairwiseRating(req, res, next) {
    try {
      const { 
        playerRating, 
        opponentRating, 
        actualResult, 
        cfRating, 
        format,
        playerSubmissions = [],
        opponentSubmissions = []
      } = req.body;

      if (!playerRating || !opponentRating || actualResult === undefined || !cfRating || !format) {
        return res.status(400).json({ 
          error: 'playerRating, opponentRating, actualResult, cfRating, and format are required' 
        });
      }

      const playerData = { submissions: playerSubmissions };
      const opponentData = { submissions: opponentSubmissions };

      const result = ratingCalculator.calculateNewRating(
        playerRating,
        opponentRating,
        actualResult,
        cfRating,
        format,
        playerData,
        opponentData
      );

      res.json({ success: true, result });
    } catch (err) {
      next(err);
    }
  }

  // Apply rating changes to database (called after session ends)
  async applyRatingChanges(req, res, next) {
    try {
      const { sessionId, ratingChanges } = req.body;

      if (!sessionId || !ratingChanges || !Array.isArray(ratingChanges)) {
        return res.status(400).json({ error: 'Session ID and rating changes array are required' });
      }

      console.log('Applying rating changes for session:', sessionId);

      const results = [];

      for (const change of ratingChanges) {
        try {
          // Update user rating
          const updatedRating = await db.updateUserRating(
            change.playerId, 
            change.newRating || (change.oldRating + change.ratingChange),
            change.ratingChange || change.averageRatingChange
          );

          // Create rating history record
          const historyData = {
            user_id: change.playerId,
            session_id: sessionId,
            old_rating: change.oldRating,
            new_rating: change.newRating || (change.oldRating + change.ratingChange),
            rating_change: change.ratingChange || change.averageRatingChange,
            k_factor: change.kFactor,
            expected_result: change.expectedResult,
            actual_result: change.actualResult || change.teamResult,
            contest_format: req.body.format,
            opponent_rating: change.opponentRating,
            created_at: new Date().toISOString()
          };

          const history = await db.createRatingHistory(historyData);

          results.push({
            userId: change.playerId,
            updatedRating,
            history
          });

        } catch (userError) {
          console.error(`Failed to update rating for user ${change.playerId}:`, userError);
          results.push({
            userId: change.playerId,
            error: userError.message
          });
        }
      }

      res.json({
        success: true,
        sessionId,
        appliedChanges: results.filter(r => !r.error),
        errors: results.filter(r => r.error)
      });

    } catch (err) {
      next(err);
    }
  }

  // Get points history
  async getPointsHistory(req, res, next) {
    try {
      const userId = req.params.userId || req.userId;
      const limit = parseInt(req.query.limit) || 50;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const history = await db.getPointsHistory(userId, limit);
      res.json({ history });
    } catch (err) {
      next(err);
    }
  }

  // Get rating history
  async getRatingHistory(req, res, next) {
    try {
      const userId = req.params.userId || req.userId;
      const limit = parseInt(req.query.limit) || 50;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const history = await db.getRatingHistory(userId, limit);
      res.json({ history });
    } catch (err) {
      next(err);
    }
  }

  // Get leaderboards
  async getRatingLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const leaderboard = await db.getRatingLeaderboard(limit);
      
      res.json({ leaderboard });
    } catch (err) {
      next(err);
    }
  }

  async getGlobalLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const leaderboard = await db.getGlobalLeaderboard(limit);
      
      res.json({ leaderboard });
    } catch (err) {
      next(err);
    }
  }

  async getArenaLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const leaderboard = await db.getArenaLeaderboard(limit);
      
      res.json({ leaderboard });
    } catch (err) {
      next(err);
    }
  }

  // Session points
  async getSessionPoints(req, res, next) {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const sessionPoints = await db.getSessionPoints(sessionId);
      res.json({ sessionPoints });
    } catch (err) {
      next(err);
    }
  }

  async createSessionPoints(req, res, next) {
    try {
      const { sessionId, userId, points, problemsSolved, rank } = req.body;

      if (!sessionId || !userId || points === undefined) {
        return res.status(400).json({ error: 'Session ID, User ID, and points are required' });
      }

      const sessionPointsData = {
        session_id: sessionId,
        user_id: userId,
        points: points,
        problems_solved: problemsSolved || 0,
        rank: rank || null,
        created_at: new Date().toISOString()
      };

      const sessionPoints = await db.createSessionPoints(sessionPointsData);
      
      // Also add to user's total points
      await db.addPoints(userId, points, `arena_session_${sessionId}`, {
        sessionId,
        problemsSolved,
        rank
      });

      res.json({ success: true, sessionPoints });
    } catch (err) {
      next(err);
    }
  }

  // Record problem submission for rating calculations
  async recordSubmission(req, res, next) {
    try {
      const { sessionId, userId, problemId, status, score, timeFromStart, submissionTime } = req.body;

      if (!sessionId || !userId || !problemId || !status) {
        return res.status(400).json({ error: 'sessionId, userId, problemId, and status are required' });
      }

      console.log('Recording submission for rating calculations:', {
        sessionId,
        userId,
        problemId,
        status,
        score,
        timeFromStart,
        submissionTime
      });

      // Calculate penalty minutes for wrong submissions (for ICPC format)
      let penaltyMinutes = 0;
      if (status !== 'accepted') {
        // Get previous wrong submissions for this problem
        const previousSubmissions = await db.getProblemSubmissions(sessionId, userId, problemId);
        const wrongSubmissions = previousSubmissions.filter(s => s.status !== 'accepted');
        penaltyMinutes = wrongSubmissions.length * 20; // 20 minutes penalty per wrong submission
      }

      const submissionData = {
        session_id: sessionId,
        user_id: userId,
        problem_id: problemId,
        status: status,
        score: score || 0,
        time_from_start: timeFromStart, // Time in seconds from contest start
        penalty_minutes: penaltyMinutes,
        submission_time: submissionTime || new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      const submission = await db.createProblemSubmission(submissionData);
      
      console.log('Submission recorded successfully:', submission);
      res.json({ success: true, submission });
    } catch (err) {
      console.error('Error recording submission:', err);
      next(err);
    }
  }

  // Finalize session and calculate ratings
  async finalizeSession(req, res, next) {
    try {
      const { sessionId, participants, format, roomMode } = req.body;

      if (!sessionId || !participants || !format) {
        return res.status(400).json({ error: 'sessionId, participants, and format are required' });
      }

      console.log('Finalizing session:', sessionId);

      // Get all submissions for this session
      const allSubmissions = await db.getSessionSubmissions(sessionId);
      
      // Enhance participants with their submissions
      const enhancedParticipants = participants.map(p => ({
        ...p,
        submissions: allSubmissions.filter(s => s.user_id === p.userId)
      }));

      // Calculate rating changes
      const ratingChanges = ratingCalculator.calculateSessionRatings(enhancedParticipants, format, roomMode);

      // Apply rating changes to database
      const applyResult = await this.applyRatingChanges({
        body: { sessionId, ratingChanges, format }
      }, { json: () => {} }, () => {});

      // Create session results
      const sessionResults = [];
      for (const participant of participants) {
        const ratingChange = ratingChanges.find(r => r.playerId === participant.userId);
        
        const resultData = {
          session_id: sessionId,
          user_id: participant.userId,
          final_rank: participant.rank,
          final_score: participant.finalScore || 0,
          problems_solved: participant.problemsSolved || 0,
          team_type: participant.teamType,
          old_rating: ratingChange?.oldRating,
          new_rating: ratingChange?.newRating,
          rating_change: ratingChange?.ratingChange || ratingChange?.averageRatingChange
        };

        const result = await db.createSessionResult(resultData);
        sessionResults.push(result);
      }

      res.json({
        success: true,
        sessionId,
        ratingChanges,
        sessionResults
      });

    } catch (err) {
      next(err);
    }
  }

  // User statistics
  async getUserStats(req, res, next) {
    try {
      const userId = req.params.userId || req.userId;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const stats = await db.getUserStats(userId);
      res.json({ stats });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PointsController();