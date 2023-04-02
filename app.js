const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const bodyParser = require("body-parser");
require("dotenv").config();
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
const {  postUserSignup,  postUserLogin,  getProfileDetails, postGetData } = require("./src/controller/userController");
const { isUser } = require("./src/middleware/isUser");
mongoose.set("strictQuery", true);
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

const PORT = process.env.PORT || 3000;
const pass = process.env.dbPassword;

mongoose
  .connect(
    `mongodb+srv://admin-aces:${pass}@cluster0.buvru.mongodb.net/docvalidation`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then((res) => {
    console.log("MongoDB connected");
  });

app.get("/", (req, res) => {
  res.status(200).json({
    status: 200,
    message: "Api is Running Copyright @TeamDocValidation",
  });
});

// User Signup API
app.post("/user/signup", postUserSignup);

//User Login API
app.post("/user/login", postUserLogin);

// User Profile Details

app.get("/user/profile/:emailId", isUser, getProfileDetails);

app.post("/user/getdata", upload.array("image", 3), postGetData);

//Server Port
app.listen(PORT, () => {
  console.log("Server is Running");
});
