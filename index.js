require('dotenv').config();

const express =require('express');
const nodemailer=require('nodemailer');
const mongoose=require('mongoose');
const Email=require("./schema.js");
const schedule=require("node-schedule");
const app=express();
let port=3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... existing code ...

app.set('view engine', 'ejs'); // Set EJS as the view engine
app.set('views', __dirname + '/views'); // Specify the views directory

// ... existing code ...

main().then(()=>{
  console.log("Connection Success");
})
.catch((err)=>{
  console.log("Some Error Occured");
});

async function main(){
  await mongoose.connect('mongodb://127.0.0.1:27017/email-connect');
}

const dummyEmailData = {
  user: "Abrahim shekh", // Example user
  from: "abrm@example.com", // Valid sender email
  to: "rokish@example.com", // Valid receiver email
  message: "Hello, this is a test message.", // Sample message
  dateCreated: new Date(), // Current date
  sendingTime: new Date(Date.now() + 3600000) // 1 hour in the future
};
 
app.get("/save",(req,res)=>{
  //for saving the data
  Email.create(dummyEmailData).then((data)=>{console.log(data);
    res.send("data saved ");
  });
});


app.get("/",async (req,res)=>{
  //Email.find().then((data)=>{console.log(data);}) 
    res.render('index.ejs'); 
})

app.post("/mail",(req,res)=>{
    const {to,subject,body,sendingDate}=req.body;
   const date= new Date(sendingDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const data={
      user:"Ak@gmail.com",
      from: "Ak@gmail.com",
      to: to,
      message:body,
      sendingTime:date
    }

    //Email.create(data).then((data)=>{console.log("data saved ",data)});

     const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for port 465, false for other ports
        auth: {
          user: process.env.EMAIL_ID,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      
     // async..await is not allowed in global scope, must use a wrapper
     
      // Schedule the job to send the 
      //validating the date
      const scheduledDate = new Date(sendingDate);
      

    
    
         schedule.scheduleJob(scheduledDate, async () => {
        await mail(to, subject, body); // Call the mail function
    });
      

    //croning 
    //by this we can schedule this job at every time interval
//crone guru website for crone type 
//this is the every 2 sec mail sent 


  //  schedule.scheduleJob(m-job,'*/2 * * * * *', async () => {
  //      await mail(to, subject, body); // Call the mail function
          //schedule.cancelJob(m-job); for cancelling the job we will get output only once 
  // });
     

      async function mail(to,subject,body){
        // send mail with defined transport object

        try{
        const info = await transporter.sendMail({
          from:process.env.EMAIL_ID, // sender address
          to: `${to}`, // list of receivers
          subject: `${subject}`, // Subject line
          text:`${body}`, // plain text body
        });
        
        console.log(info.messageId);
        
        if(info.messageId){// .messageId 
          res.render("success.ejs"); 
        }
       }
       catch{
          res.render("error.ejs");
       }
     }
 });



app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});