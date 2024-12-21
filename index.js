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
      let token = jwt.sign({ email: email, userid: user._id }, process.env.SECRET);

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
app.get('/', async (req, res) => {
  res.render('email/index.ejs');
});

// Show email history
app.get('/history', async (req, res) => {
  const allmails = await Email.find({});
  res.render('email/History.ejs', { allmails });
});

// Save email and schedule sending
app.post('/mail', (req, res) => {
  const { to, subject, body, sendingDate } = req.body;

  const data = {
    user: 'Ak@gmail.com',
    from: 'Ak@gmail.com',
    to: to,
    Subject: subject,
    message: body,
    sendingTime: sendingDate
  };

  // Save data to database
  Email.create(data).then((data) => {
    console.log('Data saved:', data);
  });

  // Schedule the email to be sent at the specified time
  const scheduledDate = new Date(sendingDate);
   schedule.scheduleJob(scheduledDate, async () => {
   await sendEmail(data);
  });
  res.redirect('/history');
});

// Show individual email details
app.get('/mail/:id', async (req, res) => {
  const { id } = req.params;
  const mail = await Email.findById(id);
  res.render('email/showmail.ejs', { mail });
});

// Show pending emails
app.get('/pending', async (req, res) => {
  const currentDate = Date(); // Get the current date
  const allmails = await Email.find({
    sendingTime: { $gt: currentDate },
  });
  res.render('email/pending.ejs', { allmails });
});

// Show delivered emails
app.get('/delivered', async (req, res) => {
  const currentDate = Date(); // Get the current date
  const allmails = await Email.find({
    sendingTime: { $lt: currentDate },
  });
  res.render('email/pending.ejs', { allmails });
});


app.get("/logout",(req,res)=>{
  res.cookie('token',"");
  res.redirect('/login');
})
// Server setup
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
