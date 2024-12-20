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


const userSchema=new mongoose.Schema({
   user:{
    type:String,
    required:true,
   },
   accountPassword:{
    type:String,
    required:true,
   },
   credentials: [          //have emails with there own password
    {
      email: {
        type: String,
        required: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      },
      password: {
        type: String,
        required: true,
        trim: true,
      },
    }
  ],
  sendmailID:[
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'email',
    }
  ]

})

module.exports = mongoose.model('User', userSchema);