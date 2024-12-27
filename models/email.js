const mongoose=require("mongoose");

// Connect to MongoDB
main().then(() => {
  console.log('Connection Success');
}).catch((err) => {
  console.log('Error Occurred:', err);
});

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/email-connect');
}


const emailSchema = new mongoose.Schema({
    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user" // Refers to the User model
    },
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
       // match: [/^\S+@\S+\.\S+$/, 'Invalid email format'], // Validates email format
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
    fileLink: {
        type: String,
        required: false, // Not mandatory
    },
});

module.exports = mongoose.model('Email', emailSchema);
