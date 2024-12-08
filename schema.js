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
    message: {
        type: String,
        required: true,
        trim: true,
        minlength: [1, 'Message cannot be empty'], // Ensures a non-empty message
    },
    dateCreated: {
        type: String,
        default: new Date().toLocaleString("en-TN", { timeZone: "Asia/Kolkata" }) , // Automatically sets the current date/time
    },
    sendingTime: {
        type: String,
        required: true, // Ensures the sending time is provided
        // validate: {
        //     validator: function (value) {
        //         return value > new Date(); // Ensures the sending time is in the future
        //     },
       //     message: 'Sending time must be in the future',
       // },
    },
});

module.exports = mongoose.model('Email', emailSchema);
