require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const Email = require('./schema.js'); // Your Mongoose email schema
const cron = require('node-cron');
const ejsMate = require('ejs-mate');
const method = require('method-override');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const schedule=require('node-schedule');

const app = express();
let port = 3000;

// Session configuration
const sessionOptions = {
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  }
};

app.use(session(sessionOptions));
app.use(flash());

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

app.use((req, res, next) => {
  res.locals.successMsg = req.flash('success');
  res.locals.errorMsg = req.flash('error');
  next();
});

// Connect to MongoDB
main().then(() => {
  console.log('Connection Success');
}).catch((err) => {
  console.log('Error Occurred:', err);
});

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/email-connect');
}

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change to your email service provider
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASSWORD,
  },
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
  req.flash('success', 'Mail Created Successfully');
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
  const allMails = await Email.find({
    sendingTime: { $gt: currentDate },
  });
  res.render('email/pending.ejs', { allMails });
});

// Show delivered emails
app.get('/delivered', async (req, res) => {
  const currentDate = Date(); // Get the current date
  const allMails = await Email.find({
    sendingTime: { $lt: currentDate },
  });
  res.render('email/pending.ejs', { allMails });
});

// Server setup
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
