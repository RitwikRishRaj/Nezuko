const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// User Management Routes
router.post('/create', userController.createUser);
router.get('/details', userController.getUserDetails);
router.get('/search', userController.searchUsers);
router.post('/update-rating', userController.updateRating);
router.get('/exists', userController.checkUserExists);

module.exports = router;