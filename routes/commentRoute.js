const authController = require('../controllers/authController');
const commentController = require('../controllers/commentController');
const express = require('express');

const router = express.Router({ mergeParams: true });

router.get('/', commentController.getAllComments)
router.get('/:id', commentController.getComment)
router.post('/', commentController.newComment)

// only logged in users can use this route
router.use(authController.protect, authController.restrictTo('user'))
router.delete('/:id', commentController.deleteComment)

// nested route for comments
// router.post('/', commentController.newComment)


module.exports = router;