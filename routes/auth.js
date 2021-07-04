const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
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

  //Create new user
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
  });
  try {
    const savedUser = await user.save();
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
  if(!validPass) return res.status(400).send('Invalid Cridentials');

  //Create and assign Token
  const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
  res.header('auth-token', token).send(token);
});

module.exports = router;
