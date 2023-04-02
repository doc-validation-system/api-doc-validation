const { User } = require("../model/userModel");
const md5 = require("md5");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const secretKey = process.env.secretKey;
const tesseract = require("tesseract.js");

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
      let flagApi=true;
      while(flagApi){
        const apiKey = getApiKey();
        let user= await User.findOne({apiKey: apiKey});
        if(!user){
          flagApi=false;
        }
      }
      let user = await User.findOne({
        emailId: emailId,
      });
      if (user) {
        res.status(403).json({
          title: "Invalid Request",
          message: "User Already Exists",
        });
        return;
      }
      const newUser = new User({
        emailId: emailId,
        password: md5(password),
        organizationName: organizationName,
        createdAt: today.getFullYear() + "-" + month + "-" + date,
        apiKey: apiKey,
        updateAt: today.getFullYear() + "-" + month + "-" + date,
      });
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
      let user = await User.findOne({
        emailId: emailId,
      });
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
            {
              emailId: emailId,
            },
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
  let user = await User.findOne({
    emailId: emailId,
  });
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

exports.postGetData = async (req, res) => {
  const {apiKey,name,
    dob,voterId,panId,aadharId}=req.body;
  let data = "";
  let result={};
  let fileName;
  for(let i=0;i<req.files.length;i++){
    fileName=req.files[i].originalname.split("_")[1];
    fileName=fileName.split(".")[0];
    if(fileName!=='voter'&&fileName!=='aadhar'&&fileName!=='pan'){
      res.status(401).json({
        title: "Invalid File Name",
        message: "File Name should be in proper convention"
      });
      return
    }
   await tesseract
    .recognize(`uploads/${req.files[i].originalname}`, "eng")
    .then((res) => {
      data = res.data.text;
      let foundName=getName(data,name);
      let foundDob=getDate(data,dob);
      let foundId;
      if(fileName==='voter'){
        foundId=getId(data,voterId);
      }else if(fileName==='aadhar'){
        foundId=getId(data,aadharId);
      }else if(fileName==='pan'){
        foundId=getId(data,panId);
      }
      result[fileName]={
        name: foundName,
        dob: foundDob,
        id: foundId
      }
    })
    .catch((error) => {
      console.log(error.message);
    });
  }
  res.status(200).json({
    title: "Successfully Data Received",
    data: result
  });
};

function getApiKey() {
  let apiKey = "";
  let charList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  for (var i = 0; i < 20; i++) {
    let randomNumber = Math.trunc(Math.random() * 52);
    apiKey = apiKey + charList.charAt(randomNumber);
  }
  for (var i = 0; i < 5; i++) {
    apiKey = apiKey + Math.trunc(Math.random() * 9) + 1;
  }
  for (var i = 0; i < 5; i++) {
    let randomNumber = Math.trunc(Math.random() * 52);
    apiKey = apiKey + charList.charAt(randomNumber);
  }
  return apiKey;
}



function getName(data,name) {
  let nameList = name.split(" ");
  let dataList = data.split(" ");
  let countNameData = 0;
  dataList=dataList.map((ele) =>{
    return  ele.toUpperCase();
  });
  nameList.map((ele) => {
    if (dataList.includes(ele.toUpperCase())) countNameData++;
  });
  let result = countNameData === nameList.length;
  return result;
}

function getDate(data,dob) {
  let result = data.includes(dob);
  return result;
}

function getId(data,id) {
  let result = data.includes(id);
  return result;
}