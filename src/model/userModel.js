const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const customerUser = new Schema({
    emailId: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    organizationName: {
        type: String,
        required: true
    },
    numberOfRequest: String,
    createdAt: {
        type: String,
        required: true
    },
    apiKey: {
        type: String,
        required: true
    },
    token: String,
    updateAt: {
        type: String,
        required: true
    }
});

exports.User = mongoose.model("User", customerUser);