const userModel = require("../models/user.model");
const userService = require("../services/user.services");
const { validationResult } = require("express-validator");
const blackListTokenModel = require("../models/blacklistToken.model");

module.exports.registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, email, password } = req.body;

  const isUserAlreadyExists = await userModel.findOne({ email });
  if (isUserAlreadyExists) {
    return res.status(400).json({ message: "User already cleaexists" });
  }

  // Call the static method
  const hashedPassword = await userModel.hashPassword(password);

  const user = await userService.createUser({
    firstName: fullName.firstName,
    lastName: fullName.lastName,
    email,
    password: hashedPassword,
  });

  const token = user.generateAuthToken(); // Use instance method

  res.status(201).json({ token, user });
};

module.exports.loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body
  const user = await userModel.findOne({ email }).select('+password')

  if(!user) {
    return res.status(401).json({ message: 'Invalid email or password'})
  }

  const isMatch = await user.comparePassword(password)

  if(!isMatch) {
    return res.status(401).json({ message: 'Invalid email or password'})
  }

  const token = user.generateAuthToken()

  res.status(200).json({ token, user })
}

module.exports.getUserProfile = async(req, res, next) => {
  res.status(200).json({ user: req.user })
}

module.exports.logoutUser = async(req, res, next) => {
  res.clearCookie('token')
  const token = req.cookies.token || res.headers.authorization.split('')[1]

  await blackListTokenModel.create({ token })
  res.status(200).json({ message: 'Logged out successfully'})
}
