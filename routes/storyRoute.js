const authController = require('../controllers/authController');
const storyController = require('../controllers/storyController');
const commentRouter = require('./../routes/commentRoute')
const express = require('express');

const router = express.Router();

router.use('/:storyId/comments', commentRouter)

router.get('/allStories', storyController.getAllStories)
router.get('/:id', storyController.getAStory)
// router.patch('/stories/:id', storyController.updateStory)    


router.delete('/:id', storyController.deleteStory)
router.patch('/:id', authController.protect, storyController.updateStory)

// only logged in users can use this route 
router.use(authController.protect, authController.restrictTo('user'))
router.get('/', storyController.prevStory)
router.post('/newstory', storyController.newStory)



module.exports = router;

