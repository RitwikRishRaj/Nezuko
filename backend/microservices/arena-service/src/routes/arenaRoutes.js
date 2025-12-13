const express = require('express');
const arenaController = require('../controllers/arenaController');

const router = express.Router();

// Arena Session Routes
router.post('/session', arenaController.createSession);
router.get('/session/:roomId', arenaController.getSession);
router.put('/session/:sessionId/status', arenaController.updateSessionStatus);

// Participant Routes
router.get('/session/:sessionId/participants', arenaController.getParticipants);
router.post('/session/:sessionId/join', arenaController.joinSession);

// Submission Routes
router.post('/submit', arenaController.submitSolution);
router.get('/session/:sessionId/submissions', arenaController.getSubmissions);

// Leaderboard Routes
router.get('/session/:sessionId/leaderboard', arenaController.getLeaderboard);
router.get('/session/:sessionId/team-stats', arenaController.getTeamStats);

// Sync Routes
router.post('/sync', arenaController.syncProgress);

module.exports = router;