const Comment = require('./../models/commentModel')
const tryCatch = require('./../utils/tryCatch')

const success = (statusCode, res, message) => {
    res.status(statusCode).json({
        message
    })
}

exports.getAllComments = tryCatch(async (req, res) => {
    const comment = await Comment.find()

    res.status(200).json({
        total: comment.length,
        comment
    })

})

exports.newComment = tryCatch(async (req, res) => {
    if (!req.body.storyId) req.body.storyId = req.params.storyId
    // if (!req.body.user) req.body.user = req.user.id

    const data = {
        comment: req.body.comment,
        story: req.body.storyId,
    }

    const newComment = await Comment.create(data)

    success(201, res, newComment)

})

exports.getComment = tryCatch(async (req, res) => {
    const comment = await Comment.findById(req.params.id)

    success(200, res, comment)
    
})

exports.deleteComment = tryCatch(async (req, res) => {
    const comment = await Comment.findByIdAndDelete(req.params.id)

    if(!comment) {
        throw new AppError("Not Found", "Sorry This Accout does not exist ", 404)
    }
    success(204, res, null)
})

