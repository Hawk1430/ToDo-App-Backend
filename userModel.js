const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema  = new Schema({
    name:{type: String, required: true, trim: true},
    email:{type: String, required: true, unique: true, trim: true},
    password:{type: String, required: true, trim: true},
}, {timestamps: true})

const Users = mongoose.model('Users', userSchema)

module.exports = Users;