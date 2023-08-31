const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    comment: {
        type: String,
    },
    createdAt:{
      type:Date,
      default: Date.now
    },
    story: {
        type: mongoose.Schema.ObjectId,
        ref: 'Story',
        // required: true
    }
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
    timestamps: true
})

// remeber to add user name and photo so it can show those details sure 

commentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'story',
    select: 'title'
  })
  next();
})

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;