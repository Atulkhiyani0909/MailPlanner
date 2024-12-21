require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const Email = require('./models/email.js'); // Your Mongoose email schema
const cron = require('node-cron'); //to schedule process in fixed interval
const ejsMate = require('ejs-mate');
const method = require('method-override');
const path = require('path');
const schedule=require('node-schedule');
const cookieParser = require('cookie-parser');
const jwt=require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User=require('./models/user.js');

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


const app = express();
let port = 3000;



// Use the secret string directly for cookie-parser
app.use(cookieParser("MailPlanner"));


app.use(express.static(path.join(__dirname, 'public')));

//to read the data of the frontend 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(method('_method'));
app.engine('ejs', ejsMate);

// Static files
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));




// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change to your email service provider
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
});

//gemini 
app.post('/generate-ai', async (req, res) => {
  try {
      const { topic } = req.body;
      // Generate AI content
      const response = await model.generateContent(topic +" only solve the question which contains the email only in 160 words with proper subject ,body don't give any answer not more than 160 words always less than or equal to it");
      // Sending the AI-generated content back to the client
      const generatedText = response.response.text();
      return res.status(200).json({ generatedText });
  } catch (error) {
      return res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/signup',(req,res)=>{
   res.render('user/signup');
});

app.post('/signup', async (req, res) => {
  try {
    // Check if the email already exists in the database
    let check = await User.findOne({ 'credentials.email': req.body.email });

    if (!check) {
      // Destructure data from req.body
      let { name, pass, email, emailpassword } = req.body;

      // Hash the password with bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(pass, salt);

      // Create the new user
      let user = await User.create({
        user: name,
        credentials: [
          {
            email: email,
            password: emailpassword,
          },
        ],
        accountPassword: hashedPassword,
      });

      // Create a JWT token
      let token = jwt.sign({ email: user.credentials.email, userid: user._id }, process.env.SECRET);

      // Set the token as a cookie
      res.cookie("token", token, {
        httpOnly: true, // Protect cookie from being accessed by client-side scripts
        maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expires in 7 days
      });

      // Redirect to the login page after successful signup
      return res.redirect("/login");
    }
    // If email already exists, send an error message
    res.status(400).json({ message: 'Email already exists' });

  } catch (err) {
    // Handle any errors (e.g., database issues, bcrypt errors)
    console.error("Error during signup:", err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/login',(req, res) => {
  res.render('user/login');
});


app.post('/login', async (req, res) => {
  let {email,pass}=req.body;
    let user=await User.findOne({ 'credentials.email': email });
    
    
    if(user){
         bcrypt.compare(pass,user.accountPassword, function(err, result) {
                console.log(result);//boolean output
                if(result){
                  let token=jwt.sign({email:user.credentials.email,userid:user._id},process.env.SECRET);
                  res.cookie("token", token, {
                    httpOnly: true,       // Protect cookie from being accessed by client-side scripts
                    maxAge: 7 * 24 * 60 * 60 * 1000 // Cookie expires in 7 days
                });
                   res.redirect("/profile");
                }
                else{
                 res.redirect("/login");
                }
             });
    }else{
       res.redirect("/signup");
    }
});

app.get('/profile',isLoggedIn,async (req, res) =>{
   let user =await User.findById(req.user.userid);
   let count=await Email.find({userID:user._id});
   console.log(count);
     res.render('user/profile',{user,count});
});

// Function to send an email
const sendEmail = async (email) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_ID, // Sender address
      to: email.to, // Recipient email
      subject: email.Subject, // Email subject
      text: email.body, // Email body
    });
    console.log(`Email sent to ${email.to}`);
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
  }
};

// Cron job to check and send unsent emails every minute
cron.schedule('* * * * *', async () => {
  console.log('Checking for unsent emails...');

  const currentTime = new Date(); // Current date and time

  try {
    // Find emails where sendingDate is less than or equal to the current time and is not yet sent
    const emailsToSend = await Email.find({
      sendingTime: { $lte: currentTime },
      isSent: false, // Only find emails that haven't been sent
    });

    console.log(`Found ${emailsToSend.length} emails to send.`);
    // Send each email
    for (const email of emailsToSend) {
      await sendEmail(email); // Send the email
      // Mark the email as sent
      email.isSent = true;
      await email.save(); // Save the updated email
    }
  } catch (error) {
    console.error(`Error while checking and sending emails: ${error.message}`);
  }
});

// Routes

// Render index page
app.get('/',isLoggedIn,async (req, res) => {
  res.render('email/index.ejs');
});

// Show email history
app.get('/history',isLoggedIn,async (req, res) => {
  const allmails = await Email.find({});
  res.render('email/History.ejs', { allmails });
});

// Save email and schedule sending
app.post('/mail', isLoggedIn,async (req, res) => {
  const { to, subject, body, sendingDate } = req.body;
 let person=await User.findById(req.user.userid);
 console.log(person);
  const data = {
    userID:person._id,
     user:person.user,
     from:person.credentials[0].email,
    to: to,
    Subject: subject,
    message: body,
    sendingTime: sendingDate
  };


  // Save data to database
  let result=await Email.create(data);
person.sendmailID.push(result._id);
person.save();

  // Schedule the email to be sent at the specified time
  const scheduledDate = new Date(sendingDate);
   schedule.scheduleJob(scheduledDate, async () => {
   await sendEmail(data);
  });
  res.redirect('/history');
});

// Show individual email details
app.get('/mail/:id',isLoggedIn,async (req, res) => {
  const { id } = req.params;
  const mail = await Email.findById(id);
  res.render('email/showemail.ejs',{mail});
});

// Show pending emails
app.get('/pending', isLoggedIn,async (req, res) => {
  const currentDate = Date(); // Get the current date
  const allmails = await Email.find({
    sendingTime: { $gt: currentDate },
  });
  res.render('email/pending.ejs', { allmails });
});

// Show delivered emails
app.get('/delivered', isLoggedIn,async (req, res) => {
  const currentDate = Date(); // Get the current date
  const allmails = await Email.find({
    sendingTime: { $lt: currentDate },
  });
  res.render('email/pending.ejs', { allmails });
});



app.get("/logout",(req,res)=>{
  res.cookie('token',"");
  res.redirect('/login');
});


function isLoggedIn(req, res,next){
  if(req.cookies.token=="") res.redirect("/login");
  else{
     let data =jwt.verify(req.cookies.token,process.env.SECRET);
     req.user=data;
     next();
  }
}



// Server setup
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
