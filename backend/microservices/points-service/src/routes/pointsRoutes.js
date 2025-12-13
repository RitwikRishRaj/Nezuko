const express = require('express');
const pointsController = require('../controllers/pointsController');

const router = express.Router();

// User Rating Routes
router.get('/rating/:userId?', pointsController.getUserRating);
router.get('/rating-history/:userId?', pointsController.getRatingHistory);

// User Points Routes
router.get('/user/:userId?', pointsController.getUserPoints);
router.post('/add', pointsController.addPoints);
router.get('/history/:userId?', pointsController.getPointsHistory);
router.get('/stats/:userId?', pointsController.getUserStats);

// Rating Calculation
router.post('/calculate-ratings', pointsController.calculateRatings);
router.post('/calculate-pairwise', pointsController.calculatePairwiseRating);
router.post('/apply-ratings', pointsController.applyRatingChanges);

// Leaderboards
router.get('/leaderboard/rating', pointsController.getRatingLeaderboard);
router.get('/leaderboard/global', pointsController.getGlobalLeaderboard);
router.get('/leaderboard/arena', pointsController.getArenaLeaderboard);

// Session Management
router.get('/session/:sessionId', pointsController.getSessionPoints);
router.post('/session', pointsController.createSessionPoints);
router.post('/submission', pointsController.recordSubmission);
router.post('/finalize-session', pointsController.finalizeSession);

module.exports = router;