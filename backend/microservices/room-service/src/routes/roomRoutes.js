const express = require('express');
const roomController = require('../controllers/roomController');

const router = express.Router();

// Room Configuration Routes
router.post('/config', roomController.createOrUpdateConfig);
router.get('/config', roomController.getConfig);

// Room Invitation Routes
router.post('/invite', roomController.createInvite);
router.get('/state', roomController.getRoomState);
router.post('/invites/respond', roomController.respondToInvite);
router.post('/invites/remove', roomController.removeUser);
router.get('/invites/check', roomController.getPendingInvites);

// Game Management Routes
router.post('/start-game', roomController.startGame);
router.post('/discard', roomController.discardRoom);

module.exports = router;