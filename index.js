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

app.use(method('_method'));

app.use(express.static(path.join(__dirname, 'public')));

//to read the data of the frontend 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//this is with JWT or we can use session for this  purpose
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    // No token provided
    res.locals.currUserID = null;
    return next(); // Proceed without crashing
  }
  try {
    // Verify the JWT and extract the payload
    const data = jwt.verify(token, process.env.SECRET);
    // Store the user ID or other relevant data in `res.locals`
    res.locals.currUserID = data.userid;
    next(); // Proceed to the next middleware
  } catch (err) {
    console.error("JWT verification failed:", err.message);

    // Clear `res.locals` to ensure no unauthorized data is stored
    res.locals.currUserID = null;

    next(); // Allow the request to proceed, but without authenticated user data
  }
});



// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(method('_method'));
app.engine('ejs', ejsMate);

// Static files
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));



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
    let check = await User.findOne({ email: req.body.email });

    if (!check) {
      // Destructure data from req.body
      let { name, pass, email, emailpassword } = req.body;
console.log(req.body);
      // Hash the password with bcrypt
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(pass, salt);

      // Create the new user
      let user = await User.create({
        user: name,
        email: email,
       password: emailpassword,
        accountPassword: hashedPassword,
      });

      // Create a JWT token
      let token = jwt.sign({ email: user.email, userid: user._id }, process.env.SECRET);

      // Set the token as a cookie
      res.cookie("token", token, {
        httpOnly: true, // Protect cookie from being accessed by client-side scripts
        maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expires in 7 days
      });

      // Redirect to the login page after successful signup
      
      return res.redirect("/history");
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
                  let token=jwt.sign({email:user.email,userid:user._id},process.env.SECRET);
                  res.cookie("token", token, {
                    httpOnly: true,       // Protect cookie from being accessed by client-side scripts
                    maxAge: 7 * 24 * 60 * 60 * 1000 // Cookie expires in 7 days
                });
                
                   return res.redirect("/history");
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
   let pendingCount = await Email.countDocuments({
    isSent: false,
    userID: user._id
  });

   let deliveredCount = await Email.countDocuments({
    isSent: true,
    userID: user._id
  });
  console.log(deliveredCount);
     res.render('user/profile',{user,count,pendingCount,deliveredCount});
});

app.get("/mail/edit/:id",async (req,res)=>{
  let {id}=req.params;
  console.log(id);
  let email= await Email.findById(id);
  console.log(email);
     res.render("email/edit.ejs",{email});
});

app.put("/mail/edit/:id",async (req,res)=>{
  let {id}=req.params;
  let {to,subject,body,newsendingDate}=req.body;
  let email=await Email.findById(id);
  
  if(newsendingDate){
    sendingDate=newsendingDate;
  }else{
    sendingDate=email.sendingTime;
  }

  let data={
    to:to,
    Subject:subject,
    message:body,
    sendingTime:sendingDate,
  }
  email=Object.assign(email,data);//to update the value 
  await email.save();
    
  res.redirect(`/mail/${id}`);
  });


  app.delete("/mail/delete/:id", async (req, res) => {
    try {
      const { id } = req.params;
  
      // Find the email by its ID
      const email = await Email.findById(id);
      if (!email) {
        return res.status(404).send("Email not found");
      }
  
      // Remove the email ID from the user's sendMailID array
      await User.findByIdAndUpdate(email.userID, { $pull: { sendmailID: email._id } });
  
      // Delete the email
      await Email.findByIdAndDelete(id);
  
      // Redirect to history page
      res.redirect("/history");
    } catch (error) {
      console.error("Error deleting email:", error.message);
      res.status(500).send("An error occurred while deleting the email");
    }
  });
  
// Email transporter setup
const createTransporter = (email, password) => {
  return nodemailer.createTransport({
    service: "gmail", // Change this to match your email service provider
    auth: {
      user: email,
      pass: password,
    },
  });
};

const sendEmail = async (data, person) => {
  try {
    console.log(data, "Email Data");
    console.log(person, "Person Data");

    // Dynamically create a transporter for the current user
    const transporter = createTransporter(person.email, person.password);

    // Ensure required email properties are provided
    if (!data.to || !data.Subject || !data.message) {
      throw new Error("Missing required email fields: 'to', 'Subject', or 'message'");
    }

    // Send the email
    let confirm= await transporter.sendMail({
      from: person.email, // Sender address
      to: data.to,        // Recipient email
      subject: data.Subject, // Email subject
      text: data.message, // Email body content
    });

    return confirm;
  } catch (error) {
    console.error(`Failed to send email: ${error.message}`);
  }
};

// Cron job to check and send unsent emails every minute
cron.schedule("* * * * *", async () => {
  console.log("Checking for unsent emails...");

  const currentTime = new Date();

  try {
    // Find emails where sendingTime is less than or equal to the current time and is not yet sent
    const emailsToSend = await Email.find({
      sendingTime: { $lte: currentTime },
      isSent: false,
    });

    console.log(`Found ${emailsToSend.length} emails to send.`);

    // Send each email
    for (const email of emailsToSend) {
      console.log(email, "Email to send");
      const person = await User.findById(email.userID);

      if (!person) {
        console.error(`User not found for email ID: ${email._id}`);
        continue;
      }

      console.log(person, "Person sending the email");
      let check=await sendEmail(email, person); // Send the email
       
      // Mark the email as sent
      if(check.accepted[0]){
        email.isSent = true;
      }else{
        email.isSent=false
        console.log(Failed);
      }
      await email.save();
    }
  } catch (error) {
    console.error(`Error while checking and sending emails: ${error.message}`);
  }
});

// Routes
app.get('/',(req, res) => {
  res.render('index');
});
app.get('/sendmail',isLoggedIn,async (req, res) => {
  res.render('email/sendmail.ejs');
});

// Show email history
app.get('/history',isLoggedIn,async (req, res) => {
  let user=await User.findById(req.user.userid);
  const allmails = await Email.find({userID:user._id});
  res.render('email/History.ejs', { allmails });
});

app.get("/failed",isLoggedIn,async (req,res)=>{
  let user=await User.findById(req.user.userid);
  const currentDate = new Date(); // Get the current date and time
  const allmails = await Email.find({
    userID: user._id, 
    isSent: false, 
    sendingTime: { $lt: currentDate } // Check if sendingTime is less than the current date
 });

 res.render('email/failed.ejs', { allmails });
  
});

// Save email and schedule sending
app.post('/mail', isLoggedIn, async (req, res) => {
  const { to, subject, body, sendingDate } = req.body;
 let person=await User.findById(req.user.userid);
 console.log(person);
  const data = {
    userID:person._id,
     user:person.user,
    from:person.email,
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
   await sendEmail(data,person);
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
  let user=await User.findById(req.user.userid);
  const currentDate = new Date(); // Get the current date and time
const allmails = await Email.find({
    userID: user._id, 
    isSent: false, 
    sendingTime: { $gt: currentDate } // Check if sendingTime is less than the current date
});
  res.render('email/pending.ejs', { allmails });
});

// Show delivered emails
app.get('/delivered', isLoggedIn,async (req, res) => {
  let user=await User.findById(req.user.userid);
  const allmails = await Email.find({userID:user._id,isSent:true});
  console.log(allmails);
  res.render('email/delivered.ejs', { allmails });
});



app.get("/logout", (req, res) => {
  res.cookie('token', '', {
      httpOnly: true, // Prevent client-side scripts from accessing the cookie
      secure: true,  // Ensure the cookie is only sent over HTTPS
      sameSite: 'strict', // Prevent CSRF attacks
      expires: new Date(0) // Immediately expire the cookie
  });
  res.redirect('/login'); // Redirect to login page
});





function isLoggedIn(req, res, next) {
    const token = req.cookies.token;

    // Check if the token cookie exists and is not empty
    if (!token || token.trim() === "") {
        return res.redirect("/login");
    }

    try {
        // Verify the token
        const data = jwt.verify(token, process.env.SECRET);
        req.user = data; // Attach user data to the request
        next(); // Proceed to the next middleware or route
    } catch (err) {
        console.error("JWT verification error:", err.message);
        return res.redirect("/login"); // Redirect to login on token failure
    }
}



// Server setup
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
