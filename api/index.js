const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
const port = 8000;
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const jwt = require("jsonwebtoken");

mongoose
  .connect(
    "mongodb+srv://sainikeshav192:kesh1av192@ecomm.vna6l0g.mongodb.net/",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected");
  })
  .catch((err) => {
    console.log("error", err);
  });

app.listen(port, () => {
  console.log("Server is running on port 8000");
});

// require our models //
const User = require("./Models/user");
const Order = require("./Models/order");

// function to send verification email to the user // 
const sendVerificationEmail = async (email,verificationToken) => {
  // create a nodemalier transport //
  const transporter = nodemailer.createTransport({
    // configure the email service //
    service:"gmail",
    auth:{
      user:"keshavsaini9837033948@gmail.com",
      pass:"kesh1_av#192"
    }
  })
  // compose the email message //
  const mailOptions = {
    from:"amazon.com",
    to:email,
    subject:"Email Verification",
    text:`Please click the following link to verify your email : http://localhost:8000/verify/${verificationToken}`
  };
  // send the email //
  try{
    await transporter.sendMail(mailOptions)
  }catch(error){
    console.log("error sanding verification email", error)
  }
}



// endpoint to register in the app //
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // check if the email is already registered //
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email Already Registered" });
    }
    // create a new user //
    const newUser = new User({ name, email, password });
    // generate and store the verification token //
    newUser.verificationToken = crypto.randomBytes(20).toString("hex");
    // save the user to the database //
    await newUser.save();
    // send verification email to the user //
    sendVerificationEmail(newUser.email,newUser.verificationToken);
  } catch (error) {
    console.log("error registering user", error);
    res.status(500).json({ message: "Regestration Failed" });
  }
});


// endPont to verify the email //
app.get("/verify/:token",async(req,res) => {
  try{
    const token = req.params.token;
    // find the user with the given verifiation token //
    const user = await User.findOne({verificationToken: token});
    if(!user){
      return res.status(404).json({message : "Invalid Verification Token"})
    }
    // Mark the user as verified // 
    user.verified = true;
    user.verificationToken = undefined;

    await user.save();
    res.status(200).json({message : "Email Verified Successfully"})
  }catch(error){
    res.status(500).json({message : "Email Verification Failed"});
  }
})