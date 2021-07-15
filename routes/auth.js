const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const User = require("../model/User");
const { registerValidation, loginValidation } = require("../Validation");

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

//generate OTP
var min = 10000;
var max = 999999;
const OTP = Math.floor(Math.random() * (max - min + 1)) + min;

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

  //Create new user
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });
  try {
    const savedUser = await user.save();
    res.status(200).json(savedUser);
    transporter.sendMail({
      to: req.body.email,
      from: 'official.adhawan@gmail.com',
      subject: 'test mail',
      text: 'This is test mail using nodemailer and SendGrid. This is your OTP ' + OTP
    })
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
  if (!validPass) return res.status(400).send("Invalid Credentials");

  //Create and assign Token
  const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
  res.header("auth-token", token).send(token);
});

module.exports = router;
