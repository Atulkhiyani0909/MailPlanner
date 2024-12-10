const mongoose=require("mongoose");



const emailSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true, // Ensures this field is mandatory
        trim: true, // Removes extra spaces
    },
    from: {
        type: String,
        required: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'], // Validates email format
    },
    to: {
        type: String,
        required: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'], // Validates email format
    },
    Subject: {
        type: String,
        required: true,
        trim: true,
        minlength: [1, 'Message cannot be empty'], // Ensures a non-empty message
    },
    message: {
        type: String,
        required: true,
        trim: true,
        minlength: [1, 'Message cannot be empty'], // Ensures a non-empty message
    },
    dateCreated: {
        type:Date,
        default:Date.now, // Automatically sets the current date/time
    },
    sendingTime: {
        type: Date,
        required: true, // Ensures the sending time is provided
      
    },
    isSent: {
        type: Boolean,
        default: false, // Initially set to false when not sent
    },
});

module.exports = mongoose.model('Email', emailSchema);
