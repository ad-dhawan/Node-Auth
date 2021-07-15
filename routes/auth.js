const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require("../model/User");
const { registerValidation, loginValidation } = require("../Validation");

//REGISTER
router.post("/register", async (req, res) => {
  //Validate Data
  const { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //Check if the user already exists
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("Email already exists");

  //Encrypting Password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  //Sending Automated Email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_EMAIL,
      pass: process.env.MAIL_PASSWORD
    }
  });

  //generate OTP
  var min = 10000;
  var max = 999999;
  const OTP = Math.floor(Math.random() * (max - min + 1)) + min;
  
  const options = {
    from: process.env.MAIL_EMAIL,
    to: req.body.email,
    subject: "Do Not Reply",
    text: "Welcome to my test Auth Node JS app\nDo not share OTP with anyone\nYour OTP is" + OTP
  }

  function SendMail() {
    transporter.sendMail(options, function(err,info) {
      if(err){
        console.log(err);
        return;
      } else {
        console.log(info.response);
      }
    })
  }

  //Create new user
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });
  try {
    const savedUser = await user.save();
    SendMail();
    res.status(200).json(savedUser);
  } catch (err) {
    console.log(err);
  }
});

//LOGIN
router.post("/login", async (req, res) => {
  //Validate Data
  const { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //Checking if email exists in database
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Email or password is wrong");

  //Check if Password is correct
  const validPass = await bcrypt.compare(req.body.password, user.password);
  if(!validPass) return res.status(400).send('Invalid Credentials');

  //Create and assign Token
  const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
  res.header('auth-token', token).send(token);
});

module.exports = router;
