const authController = require('./../controllers/authController');
const express = require('express');

const router = express.Router();


// anybody can access this routes
router.get('/:id/verify/:token', authController.verifyUser)
router.post('/signUp', authController.SignUp)
router.post('/signIn', authController.Login)
router.post('/forgottenPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

// only logged in users have access to this routes
router.use(authController.protect)
router.patch('/updatePassword',
authController.updatePassword);
router.patch('/myProfile',
authController.updateMe)

// only admins have access to this route
router.use(authController.restrictTo("user", "admin"))
router.get('/', authController.getAllUsers)
router.get('/:id', authController.protect, authController.getUser)


module.exports = router;