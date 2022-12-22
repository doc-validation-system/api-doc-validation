const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
require("dotenv").config();
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
const { postUserSignup } = require("./src/controller/userController");


const PORT = process.env.PORT || 3000;
const pass = process.env.dbPassword;

mongoose.connect(`mongodb+srv://admin-aces:${pass}@cluster0.buvru.mongodb.net/docvalidation`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then((res) => {
    console.log("MongoDB connected");
});


app.get("/", (req, res) => {
    res.status(200).json({
        status: 200,
        message: "Api is Running Copyright @TeamDocValidation"
    })
});

// User Signup API
app.post("/user/signup", postUserSignup);

app.listen(PORT, () => {
    console.log("Server is Running");
});