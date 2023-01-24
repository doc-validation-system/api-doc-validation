const { User } = require("../model/userModel");
const md5 = require("md5");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const secretKey = process.env.secretKey;

exports.postUserSignup = async (req, res) => {
  const { emailId, organizationName, password } = req.body;
  let missingVal = "";
  if (!emailId || !organizationName || !password) {
    if (!emailId) missingVal += "emailId ";
    if (!organizationName) missingVal += "organizationName ";
    if (!password) missingVal += "password ";
    res.status(400).json({
      title: "Invalid Request",
      message: `All the required data are missing, Missing Values are ${missingVal}`,
    });
    return;
  } else {
    let matchEmail =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let matchPassword =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$&*~]).{8,}$/;
    let errorValue = "";
    if (!emailId.match(matchEmail) || !password.match(matchPassword)) {
      if (!emailId.match(matchEmail)) errorValue += "Invalid Email";
      if (!password.match(matchPassword)) errorValue += "Invalid Password";
      res.status(401).json({
        title: "Invalid Data",
        message: errorValue,
      });
      return;
    }
    try {
      var today = new Date();
      var month = String(today.getMonth() + 1);
      var date = String(today.getDate());
      if (month.length < 2) month = "0" + month;
      if (date.length < 2) date = "0" + date;
      const apiKey = getApiKey();
      const newUser = new User({
        emailId: emailId,
        password: md5(password),
        organizationName: organizationName,
        createdAt: today.getFullYear() + "-" + month + "-" + date,
        apiKey: apiKey,
        updateAt: today.getFullYear() + "-" + month + "-" + date,
      });
      let user = await User.findOne({ emailId: emailId });
      if (user) {
        res.status(403).json({
          title: "Invalid Request",
          message: "User Already Exists",
        });
        return;
      }
      newUser.save((err) => {
        if (err) console.log(err + "ERROR");
        else {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.websiteMail,
              pass: process.env.websitePass,
            },
          });

          const mailOptions = {
            from: process.env.websiteMail,
            to: emailId,
            subject: "DocValidationSystem Registration Confirmation",
            text: `${emailId} has been successfully registered to DocValidationSystem`,
          };

          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.log(error);
              res.status(400).json({
                title: "Internal Server Error",
                message: "Server on Maintenance, Please try After Some time",
              });
              return;
            } else {
              console.log("Email sent: " + info.response);
              res.status(201).json({
                title: "Request Generated Succcessfully",
                message: `${emailId} registration successfull`,
              });
            }
          });
        }
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        title: "Server Error",
        message: "Internal Server Error, Server temporarily out of Service",
      });
    }
  }
};

exports.postUserLogin = async (req, res) => {
  const { emailId, password } = req.body;
  let missingVal = "";
  if (!emailId || !password) {
    if (!emailId) missingVal += "emailId";
    if (!password) missingVal += "password";
    res.status(400).json({
      title: "Invalid Request",
      message: `All the required data are missing, Missing Values are ${missingVal}`,
    });
    return;
  } else {
    let matchEmail =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let matchPassword =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$&*~]).{8,}$/;
    let errorValue = "";
    if (!emailId.match(matchEmail) || !password.match(matchPassword)) {
      if (!emailId.match(matchEmail)) errorValue += "Invalid Email";
      if (!password.match(matchPassword)) errorValue += "Invalid Password";
      res.status(401).json({
        title: "Invalid Data",
        message: errorValue,
      });
      return;
    }
    try {
      let user = await User.findOne({ emailId: emailId });
      if (!user) {
        res.status(404).json({
          title: "Invalid Username or Password",
          message:
            "User Not Exists in DocValidationApi If you are facing any issue drop a mail team.docvalidation@gmail.com our team will respond you within 24 hrs",
        });
        return;
      } else {
        var today = new Date();
        var month = String(today.getMonth() + 1);
        var date = String(today.getDate());
        if (month.length < 2) month = "0" + month;
        if (date.length < 2) date = "0" + date;
        if (user.password == md5(password)) {
          const token = jwt.sign({ id: user._id }, secretKey, {
            expiresIn: "12h",
          });
          await User.updateOne(
            { emailId: emailId },
            {
              token: token,
              updateAt: today.getFullYear() + "-" + month + "-" + date,
            }
          );
          res.status(200).json({
            title: "User Successfully Logged in",
            organizationName: user.organizationName,
            createdAt: user.createdAt,
            token: token,
            updateAt: user.updateAt,
          });
        } else {
          res.status(403).json({
            title: "Invalid Password",
            message: "Please Enter Correct Password",
          });
        }
      }
    } catch (e) {
      res.status(500).json({
        status: "Server Error",
        message: "Internal Server Error, Server temporarily out of Service",
      });
      console.log(e);
    }
  }
};

exports.getProfileDetails = async (req, res) => {
  const { emailId } = req.params;
  let user = await User.findOne({ emailId: emailId });
  if (!user) {
    res.status(406).json({
      title: "Invalid Data",
      message: "User Not Found",
    });
    return;
  } else {
    res.status(200).json({
      title: "Success",
      organizationName: user.organizationName,
      createdAt: user.createdAt,
      updateAt: user.updateAt,
    });
  }
};

function getApiKey() {
  let apiKey = "";
  let charList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (var i = 0; i < 5; i++) {
    let randomNumber = Math.trunc(Math.random() * 52);
    apiKey = apiKey + charList.charAt(randomNumber);
  }
  for (var i = 0; i < 3; i++) {
    apiKey = apiKey + Math.trunc(Math.random() * 9) + 1;
  }
  for (var i = 0; i < 5; i++) {
    let randomNumber = Math.trunc(Math.random() * 52);
    apiKey = apiKey + charList.charAt(randomNumber);
  }
  return apiKey;
}
