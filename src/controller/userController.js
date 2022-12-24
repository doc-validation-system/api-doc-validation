const { User } = require("../model/userModel");
const md5 = require("md5");
// const nodemailer = require("nodemailer");

exports.postUserSignup = async (req, res) => {
    const { emailId, organizationName, password } = req.body;
    let missingVal = "";
    if (!emailId || !organizationName || !password) {
        if (!emailId)
            missingVal += "emailId ";
        if (!organizationName)
            missingVal += "organizationName ";
        if (!password)
            missingVal += "password ";
        res.status(400).json({
            title: "Invalid Request",
            message: `All the required data are missing, Missing Values are ${missingVal}`
        });
        return
    } else {
        let matchEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        let matchPassword = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$&*~]).{8,}$/;
        let errorValue = "";
        if (!emailId.match(matchEmail) || !password.match(matchPassword)) {
            if (!emailId.match(matchEmail))
                errorValue += "Invalid Email";
            if (!password.match(matchPassword))
                errorValue += "Invalid Password";
            res.status(400).json({
                title: "Invalid Data",
                message: errorValue
            });
            return
        }
        try {
            var today = new Date();
            var month = String(today.getMonth() + 1);
            var date = String(today.getDate());
            if (month.length < 2)
                month = "0" + month;
            if (date.length < 2)
                date = "0" + date;
            const apiKey = getApiKey();
            const newUser = new User({
                emailId: emailId,
                password: md5(password),
                organizationName: organizationName,
                createdAt: today.getFullYear() + "-" + month + "-" + date,
                apiKey: apiKey
            });
            let user = await User.findOne({ emailId: emailId });
            if (user) {
                res.status(403).json({
                    title: "Invalid Request",
                    message: "User Already Exists"
                });
                return
            }
            newUser.save((err) => {
                if (err)
                    console.log(err + "ERROR");
            });
            res.status(201).json({
                title: "Request Generated Succcessfully",
                message: `${emailId} registration successfull`
            });
        } catch (e) {
            console.log(e);
        }
    }
}
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