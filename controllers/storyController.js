const Story = require('../models/storiesModel');
const tryCatch = require('./../utils/tryCatch');
const AppError = require('./../utils/AppError');
const fs = require('fs');
const path = require('path');

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


// exports.newStory = tryCatch(async (req, res) => {

//     // const data = {
//     //     title: req.body.title,
//     //     story: req.body.story,
//     //     image: req.body.image,
//     //     user_id: req.user.id,
//     //     category: req.body.category,
//     //     geolocation: req.body.geolocation
//     // }

//     // const newStory = await Story.create(data)

//     // success(201, res, newStory)

// })


exports.newStory = async (req, res) => {
    try {
        const { title, story, category, image } = req.body;

        const uploadsDir = path.join(__dirname, '..', 'uploads');

        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        let imagePath = '';
        if (image) {
            const base64Data = image.replace(/^data:image\/\w+;base64,/, ''); 
            const buffer = Buffer.from(base64Data, 'base64');

            const imageName = `${Date.now()}-image.png`;
            imagePath = `/uploads/${imageName}`;
            fs.writeFileSync(path.join(uploadsDir, imageName), buffer); 
        }

        // Create the new story in the database
        const newStory = new Story({
            title,
            user_id: req.user.id,
            story,
            category,
            image: imagePath,
            geolocation: req.body.geolocation
        });

        await newStory.save();
        res.status(201).json({ message: 'Post created successfully!', newStory });

    } catch (error) {
        console.error('Error creating story:', error);
        res.status(500).json({ message: 'Server error. Could not create post.' });
    }
};



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