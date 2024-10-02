const mongoose = require('mongoose');
const validate = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const uniqueValidator = require("mongoose-unique-validator")

const userSchema = new mongoose.Schema(
  {
    // firstname: {
    //     type: String,
    //     required: [true, 'this User must have a firstname'],
    //     trim: true
    // },
    // lastname: {
    //   type: String,
    //   required: [true, 'this user should have a lastname'],
    //   trim: true
    // },
    username: {
      type: String,
      required: [true, "user should have a username"],
      trim: true,
      unique: true
    },
    email: {
      type: String,
      required: [true, 'this user must have an email'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validate.isEmail, 'please provide a valid email']
    },
    photo: {
      type: String
    },
    password: {
        type: String,
        required: [true, 'please provide a password'],
        minLength: [8, 'minimum password lenght is 8 '],
        select: false
    },
    // country: {
    //   type: String,
    //   required: [true, 'please select your country']
    // },
    //  mobile: { 
    //       type: Number, 
    //       required: [true, 'sorry this field cannot be empty']
    //     },
    role: {
      type: String,
      default: 'user',
      enum: ['user', 'admin', 'superAdmin']
    },
    // rememberme:{
    //   type:Boolean,
    //   default: false
    // },
    verified:{type:Boolean, default:true},
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false
    },
    passwordConfirm: {
      type: String,
      validate: {
        validator: function(el) {
          return el === this.password;
        },
        message: 'password are not the same'
      }
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true
  }
);


userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
  });

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
    this.passswordChangedAt = Date().now - 1000;
    next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

  userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      );
  
      return changedTimestamp < JWTTimestamp; 
    }
  
    return false;
  };
  
  userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({resetToken}, this.passwordResetToken);

    this.passwordResetExpires = Date.now() + 15 * 60 * 1000;

    return resetToken;
  };

  userSchema.plugin(uniqueValidator, {
    message: " This {PATH} already exists"
  });

const User = mongoose.model('User', userSchema);
module.exports = User;
