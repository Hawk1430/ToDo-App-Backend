const mongoose = require('mongoose');
const Schema = mongoose.Schema;   //to make Schema in mongo

//Defining Schema
const todosSchema = new Schema({
    text:{
        type: String,
        required: true,
    },
    userId:{
        type: String,
        required: true,
    }
},{timestamps: true})

//Create a model
const Todos = mongoose.model('Todos', todosSchema)

module.exports = Todos;



