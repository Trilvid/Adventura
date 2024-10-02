const Story = require('../models/storiesModel');
const tryCatch = require('./../utils/tryCatch');
const AppError = require('./../utils/AppError');

const success = (statusCode, res, message, author) => {
    res.status(statusCode).json({
        message,
        author
    })
}

exports.getAllStories = tryCatch(async (req, res) => {

    const { category } = req.query;

    let stories;
        
    if (category) {
        stories = await Story.find({ category }); 
    } else {
        stories = await Story.find({});
    }

    res.status(200).json({
        success: true,
        total: stories.length,
        stories
    })

})


exports.newStory = tryCatch(async (req, res) => {
    const data = {
        title: req.body.title,
        story: req.body.story,
        image: req.body.image,
        user_id: req.user.id,
        category: req.body.category
    }

    const newStory = await Story.create(data)

    success(201, res, newStory)

})

exports.prevStory = tryCatch(async (req, res) => {
    const prev = await Story.find({
        user_id: req.user.id
    })

    if(prev) {
        res.status(200).json({
            total: prev.length,
            data: prev
        })
    } else {
        throw new AppError("Bad Request", "No recent posts", 403)
    }
})

exports.getAStory = tryCatch(async (req, res) => {
    // const story = await Story.findById(req.params.id).populate('comments')
    const story = await Story.findById(req.params.id)

    if(!story) {
        throw new AppError("Not Found", "This story has been deleted", 404)
    }

    const author = story.user_id

    success(200, res, story, author.username)
    
})


exports.deleteStory = tryCatch(async (req, res) => {
    const story = await Story.findByIdAndDelete(req.params.id)

    if(!story) {
        throw new AppError("Not Found", "Sorry This Accout does not exist ", 404)
    }

    // success(204, res, null)
    res.status(204).json({success: true, message: 'Story deleted successfully' })
})  


exports.updateStory = tryCatch(async (req, res) => {

    const { id } = req.param;
    const { title, story, category } = req.body;

    // Find the story by ID and update it
    const updatedStory = await Story.findByIdAndUpdate(req.params.id, {
        title,
        story,
        category
    }, { 
        new: true,
        runValidators: true, }); 

    if (!updatedStory) {
        throw new AppError("Not Found", "Sorry Failed try again ", 404)
        // return res.status(404).json({ success: false, message: 'Story not found' });
    }

    success(200, res, updatedStory, "author.firstname")
    // res.status(200).json({ success: true, story: updatedStory });

})