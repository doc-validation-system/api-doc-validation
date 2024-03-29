const { User } = require("../model/userModel");
const md5 = require("md5");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const secretKey = process.env.secretKey;
const tesseract = require("tesseract.js");
const fs=require("fs");
const { date } = require("joi");

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
      let apiKey='';
      while(flagApi){
        apiKey = getApiKey();
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
            apiKey: user.apiKey
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
      apiKey: user.apiKey
    });
  }
};

exports.postGetData = async (req, res) => {
  const {apiKey,name,
    dob,voterId,panId,aadharId}=req.body;
  if(!apiKey || !name || !dob || !voterId  || !panId || !aadharId){
    let missingVal='';
    if(!apiKey){
      missingVal+='API KEY ';
    }
    if(!name){
      missingVal+='NAME';
    }
    if(!dob){
      missingVal+='DATE OF BIRTH ';
    }
    if(!voterId){
      missingVal+='VOTER ID ';
    }
    if(!panId){
      missingVal+='PAN ID ';
    }
    if(!aadharId){
      missingVal+='AADHAR ID';
    }
    res.status(401).json({
      title: "Missing Required Data",
      message: `Missing Values are ${missingVal}`
    });
    for(let i=0;i<req.files.length;i++){
      fs.unlinkSync(`uploads/${req.files[i].originalname}`);
    }
    return
  }
  let user=await User.findOne({apiKey: apiKey});
  console.log("Request Received");
  if(!user){
    res.status(403).json({
      title: "Invalid User",
      message: "Invalid API Key Received from User"
    });
    for(let i=0;i<req.files.length;i++){
      fs.unlinkSync(`uploads/${req.files[i].originalname}`);
    }
    return
  }
  let noOfReq=user.numberOfRequest;
  if(!noOfReq){
    noOfReq=1;
  }else{
    noOfReq=Number(noOfReq)+1;
  }
  await User.findByIdAndUpdate({_id: user._id},{numberOfRequest: noOfReq});
  let data = "";
  let result={};
  let fileName;
  let foundData=0;
  if(req.files.length<1){
    res.status(403).json({
      title: "File Missing",
      message: "Please send the file to validate it."
    });
    for(let i=0;i<req.files.length;i++){
      fs.unlinkSync(`uploads/${req.files[i].originalname}`);
    }
    return
  }
  let validateDOB=isIsoDate(dob);
  if(!validateDOB){
    res.status(405).json({
      title: "Invalid Date Format",
      message: "Please Enter Correct Date Format"
    });
    for(let i=0;i<req.files.length;i++){
      fs.unlinkSync(`uploads/${req.files[i].originalname}`);
    }
    return
  }
  try{
    let dobData=new Date(dob);
    let date=String(dobData.getDate());
    let month=String(dobData.getMonth()+1);
    if(date.length<2){
      date="0"+date;
    }
    if(month.length<2){
      month="0"+month;
    }
    dobData=date+"/"+month+"/"+dobData.getFullYear();
    //console.log(dobData);
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
      console.log("Request in Process");
     await tesseract
      .recognize(`uploads/${req.files[i].originalname}`, "eng")
      .then((res) => {
        data = res.data.text;
        //console.log(data);
        let foundName=getName(data,name);
        let foundDob=getDate(data,dobData);
        let foundId;
        if(fileName==='voter'){
          foundId=getId(data,voterId,fileName);
        }else if(fileName==='aadhar'){
          foundId=getId(data,aadharId,fileName);
        }else if(fileName==='pan'){
          foundId=getId(data,panId,fileName);
        }
        result[fileName]={
          name: foundName,
          dob: foundDob,
          id: foundId
        }
        fs.unlinkSync(`uploads/${req.files[i].originalname}`);
      })
      .catch((error) => {
        console.log(error.message);
      });
    }
    for(let data in result){
      for(let d in result[data]){
        if(result[data][d]==true){
          foundData++;
        }
      }
    }
    console.log("Response will be sent within a second");
    const accuracyData=((foundData/(3*req.files.length))*100).toFixed(2);
    res.status(200).json({
      title: "Successfully Data Received",
      data: result,
      accuracy: accuracyData
    });
  }catch(e){
    res.status(500).json({
      status: "Server Error",
      message: "Internal Server Error, Server temporarily out of Service",
    });
    console.log(e);
    for(let i=0;i<req.files.length;i++){
      fs.unlinkSync(`uploads/${req.files[i].originalname}`);
    }
  }
  
}

exports.postUserLogOut = async (req, res) => {
  const {
    emailId
  } = req.body;
  var today = new Date();
  var month = String(today.getMonth() + 1);
  var date = String(today.getDate());
  if (month.length < 2) month = "0" + month;
  if (date.length < 2) date = "0" + date;
  try {
    await User.updateOne({
      emailId: emailId
    }, {
      token: "",
      updateAt: today.getFullYear() + "-" + month + "-" + date
    });

    res.status(201).json({
      title: "Success",
      message: `Successfully Logged out`,
    });
  } catch (e) {
    res.status(500).json({
      status: "Server Error",
      message: "Internal Server Error, Server temporarily out of Service",
    });
    console.log(e);
  }

}

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
  nameList=nameList.map(ele=>{
    return ele.toUpperCase();
  });
  dataList=dataList.map(ele=>{
    return ele.toUpperCase();
  });
  dataList=dataList.map((ele) =>{
    let tempDataList=ele.split('');
    let t='';
    for(let i=0;i<tempDataList.length;i++){
      try{
        if(isAlpha(tempDataList[i])){
          t+=tempDataList[i];
        }else{
          break;
        }
      }catch(e){
        break;
      }
    }
    return t.toString();
  });
  for(let i=0;i<nameList.length;i++){
    for(let j=0;j<dataList.length;j++){
      if(dataList[j]==nameList[i]){
        countNameData++;
        break;
      }
    }
  }
  let result = countNameData === nameList.length;
  return result;
}

function getDate(data,dob) {
  let result = data.includes(dob);
  return result;
}

function getId(data,id,fileName) {
  let result=false;
  if(fileName=='aadhar'){
    let matchAadhar= /^[2-9]{1}[0-9]+$/;
    if(!matchAadhar.test(id) || !(id.length==12)){
      return false;
    }
    let countData=0;
    let idList=id.split('');
    for(let i=0;i<idList.length;i+=4){
      let newList=idList.slice(i,i+4);
      let idData='';
      for(let j=0;j<4;j++){
        idData+=newList[j];
      }
      let foundId=data.includes(idData);
      if(foundId){
        countData++;
      }
    }
    return countData===3;
  }else if(fileName=='voter'){
    let matchVoter=/^[A-Z]{3}[0-9]{7}$/;
    if(!matchVoter.test(id) || !(id.length==10)){
      return false;
    }
    result = data.includes(id);
  }else if(fileName=='pan'){
    let matchPan=/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if(!matchPan.test(id) || !(id.length==10)){
      return false;
    }
    result=data.includes(id);
  }
  return result;
}

var isAlpha = function(ch){
  return typeof ch === "string" && ch.length === 1
         && (ch >= "a" && ch <= "z" || ch >= "A" && ch <= "Z");
}

function isIsoDate(str) {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str); 
  return d instanceof Date && !isNaN(d) && d.toISOString()===str; 
}