const authController = require('../controllers/authController');
const storyController = require('../controllers/storyController');
const commentRouter = require('./../routes/commentRoute')
const express = require('express');

const router = express.Router();

router.use('/:storyId/comments', commentRouter)

router.get('/allStories', storyController.getAllStories)
router.get('/:id', storyController.getAStory)

// only logged in users can use this route 
router.use(authController.protect, authController.restrictTo('user'))
router.get('/', storyController.prevStory)
router.post('/newstory', storyController.newStory)
router.delete('/:id', storyController.deleteStory)



module.exports = router;

