const mongoose=require("mongoose");

const feedbackSchema = new mongoose.Schema({
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user" // Refers to the User model
    },
    user: {
        type: String,
    },
    feedback: {
        type: String,
        required: true,
    },
    email:{
        type: String,
        required: true,
    },
    dateCreated: {
        type:Date,
        default:Date.now, // Automatically sets the current date/time
    },
});

module.exports = mongoose.model('Feedback', feedbackSchema);