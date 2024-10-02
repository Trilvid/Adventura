const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const tryCatch = require('./../utils/tryCatch')
const AppError = require('./../utils/AppError');
const { promisify } = require('util');



const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn:  process.env.JWT_EXPIRES_IN
  })
};

const success = ( statusCode, res, user, message) => {

  const token = createToken(user.id);
  const url= `${process.env.BASE_URL}auth/${user._id}/verify/${token}`;

  res.status(statusCode).json({
      status: 'success',
      token,
      role: user.role,
      message,
      url
    });
}

// verify user
exports.verifyUser = tryCatch(async (req, res) => {
  const user = await User.findOne({_id: req.params.id})
  
  if(!user) {
    throw new AppError(404, "Sorry this account is unavilable", 404)
  }
  else {
    const token = await createToken({user:user.id, token: req.params.token})

    if(!token) {
      throw new AppError(400, "please try again later", 400 )
    }

    await User.updateOne({_id: user.id},{
      $set: {verified: true}
    })

    res.redirect(200, 'http://localhost:3000/login')

    if (res) {
      res.send("will now send email")
      // remember to send email here with template tho
    }
    throw new AppError("Bad Request","email was not sent", 400)

  }
})

// module to get users
  exports.getAllUsers = tryCatch(async (req, res) => {

    const data = await User.find()
    return res.status(200).json({
      total: data.length,
    data
  })
  })

  exports.getUser = tryCatch( async (req, res) => {
      const data = await User.findById(req.user.id, {})
     return res.status(200).json(data)
  
  })

  // new user
  exports.SignUp =  tryCatch(async (req, res) => {
    
      const user = await User.create({
        // firstname: req.body.firstname,
        // lastname: req.body.lastname,
        username: req.body.username,
        email: req.body.email,
        // mobile: req.body.mobile,
        // country: req.body.country,
        password: req.body.password,
        role: req.body.role,
        active: req.body.active,
        photo: "https://res.cloudinary.com/ult-bank/image/upload/v1685139259/t9tjkxnb3nrmtjuizftp.png",

      })

      return success(201, res, user, "Account created" )
      
  })

  // login module 
  exports.Login = tryCatch(async (req, res) => {
    const {email, password} = req.body;

    const user = await User.findOne({email}).select('+password');

    if(!email || !password) {
      throw new AppError(401, "email or password cannot be empty", 401)
    }
    
   else if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError(401, "invalid login details try again", 401)
    }

    else if(user.verified === false) {
      throw new AppError(400, "your email is not verified, please go to your eamil and verify", 400)
    }

    else {

    // if(rememberme) {
    //  await User.updateOne({email: user.email},{
    //     $set: {rememberme: true}
    //   })
    // }
    return success(200, res, user, "sucessfully logged in")
  // res.send(token)
    }

  })

  // protecting the routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      message: "You are not Logged in!"
    })
  }
    
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    res.status(401).json({
      message: "Sorry This account does not exists!"
    })
  }
  
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    res.status(401).json({
      message: "This User recently changed password! please login again"
    })
  }
  
  req.user = currentUser;
  return next()
}

exports.restrictTo = (...roles) => {
return (req, res, next)  => { 

  if (!roles.includes(req.user.role)) {
    throw new AppError("unauthorized", 'you do not have permission to perform this action', 401)
  }
next();
}
}

exports.forgotPassword = tryCatch(async (req, res, next) => {
try{
const user = await User.findOne({ email: req.body.email });

if (!user) {
  throw new AppError("Not Found", "Sorry this account does not exist", 404)
}

if (user.verified === false) {
  throw new AppError('Unauthorized', "Sorry this account is not verified, verify to contd", 401)
}

const resetToken = user.createPasswordResetToken();
await user.save({ validateBeforeSave: false});

const resetURL = `${req.protocol}://${req.get(
  'host'
)}/api/v1/auth/resetPassword/${resetToken}`;

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email',
    resetURL
  });

} 
catch (err) {

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return next();
}

})


exports.resetPassword = tryCatch(async (req, res) => {
const hashedToken = crypto
  .createHash('sha256')
  .update(req.params.token)
  .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {$gt: Date.now() }
  });
  
  if (!user) {
      throw new AppError("Bad Request", "Token is invalid or has expired", 400)
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  

  success( 200, res, user)
})


exports.updatePassword = tryCatch(async (req, res) => {

const user = await User.findById(req.user.id).select('+password');

if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
  throw new AppError("Unauthorized", "your current password is wrong.", 401)
}

else if(req.body.password != req.body.passwordConfirm) {
  throw new AppError("Bad Request", "password does not match", 400)
}

user.password = req.body.password;
user.passwordConfirm = req.body.passwordConfirm;
await user.save();

return success( 200, res, user, ' Password Changed')

})


// update user profile
exports.myProfileUpdate = tryCatch(async (req, res) => {
  const data = await User.findById(req.user.id, {})

  if(data){
    res.send(data.username)
  } else {
    throw new AppError("Bad Request", "Omo nah the Worng one OOh", 400)
  }
})


const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.updateMe = async (req, res, next) => {

    try{
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        res.status(400).json({
            msg:'this route is not for password update. please use /updateMyPassword.'
        }));
    }``
      
    const filteredBody = filterObj(req.body, 
        // 'firstname', 
        // 'lastname', 
        'username', 
        'photo',
        );

    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
          new: true,
          runValidators: true,
    });
  
        if (!updatedUser) {
          res.send({
            status: "failed",
            message: "no user with that ID found"
          });
        }
  
        res.status(201).json({
          status: "success",
          updatedUser,
          message: "Profile Updated"
        });
    }
    catch (err) {
        res.send(err.message)
        console.log(err.message)
    }
    }  

  
exports.deleteMe =  tryCatch(async (req, res) => {
  
      const user = await User.findByIdAndUpdate(req.user.id, {active: false});
  
      if(!user) {
        throw new AppError("Not Found", "This User does not exist ", 404)
      }
      
      res.status(204).json({
        status: 'ok',
        data: null
      });
  
});