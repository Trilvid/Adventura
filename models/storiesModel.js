const mongoose = require('mongoose');
const { type } = require('os');

const storySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    story: {
        type: String,
    },
    user_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    image: {type: String},
    category: {type: String},
    createdAt:{type:Date, default: Date.now()},
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
    // timestamps: true
})



storySchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user_id',
    // select: 'firstname username'
    select: 'username'
  })
  next();
})


storySchema.virtual('comments', {
  ref: "Comment",
  foreignField: "story",
  localField: '_id'
})


const Story = mongoose.model('Story', storySchema);
module.exports = Story;