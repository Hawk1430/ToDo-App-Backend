require('dotenv').config();
const express = require("express");
const fs = require("fs").promises;
const mongoose = require("mongoose");
const Todos = require("./todosModel"); //imported todo model
const Users = require('./userModel'); //imported Users Model
const bcrypt = require('bcrypt'); //Password hashing module
const base64 = require('base-64'); //For encrypting and decrypting data

const app = express();

//Connect to Mongo DB
mongoose
	.connect(
		process.env.MONGO_URL
	)
	.then((res) => console.log("Successfully connected to Mongo DB"))
	.catch((err) => console.log("Error in connecting to Mongo DB: ", err));

app.use(express.json());


const validator = async (req, res, next)=>{
	try{
		const authHeader = req.headers['authorization'];
		if(!authHeader){
			console.log(authHeader)
			return res.status(400).json({status: "Failure", message:"User not authorised. Please login first"})
		}
		//take email and password fron header after decrypting
		const [email, password] = base64.decode(authHeader).split(':');
		const user = await Users.findOne({email});
		if(!user){
			return res.status(401).json({ status: "Failure", message: "Invalid credentials" });
		}

		const matchPassword = await bcrypt.compare(password, user.password);
		if(matchPassword){
			req.userId = user._id;
			next()
		}
		else{
			return res.status(401).json({ status: "Failure", message: "Invalid credentials" });
		}
	}
	catch (err){
		console.log("Error in validator: ", err.message)
		return res.status(500).json({ status: "Failure", message: "Something went wrong. Please try again later" });
	}
}


// --- Routes ---
// Get All ToDo 
app.get("/todos", validator ,(req, res) => {

	Todos.find({userId: req.userId})
		.then((response) => {
			res.status(201).json({ status: "Success", data: response });
		})
		.catch((err) => {
			res.status(500).json({
				error: `Error while fetching Todos from database. Try again later`,
			});
		});
});


//Get Particular todo
app.get("/todo/:id",validator, async (req, res) => {
	try {
		const todo = await Todos.findById(req.params.id);
		console.log(todo)
		console.log(req.userId)
		if (!todo || todo.userId.toString() !== req.userId.toString()) {
			return res
				.status(404)
				.json({
					error: `The todo with id: ${req.params.id} is not found`,
				});
		}
		res.status(201).json(todo);
	} catch (err) {
		return res.status(400).json({ error: `Invalid ID: ${req.params.id}` });
	}
});



//Post Todo
app.post("/todo", validator , async (req, res) => {
	if (!req.body || !req.body.text) {
		return res.status(400).json({ error: "Text is required" });
	}

	const { text } = req.body;
	const userId = req.userId; 
	const newTodo = new Todos({ text, userId }); //Created instance of Todos

	//To add data in Mongo DB
	newTodo
		.save()
		.then((response) => {
			res.status(201).json({
				status: "Success",
				message: "New Todo is successfully created",
			});
		})
		.catch((err) => {
			res.status(500).json({
				error: `Error while creating new Todo. Try again later`,
			});
		});
});

//Update Todo
app.put("/todo/:id", validator, async (req, res) => {
	try {
		const todoId = req.params.id;
		const todo = await Todos.findById(todoId);

		if (!todo) {
		return res.status(404).json({ error: `The todo with id: ${todoId} is not found` });
		}

		// Check ownership
		if (todo.userId.toString() !== req.userId.toString()) {
		return res.status(403).json({ error: "You are not authorized to update this todo" });
		}

		// Update only if owner
		const updatedTodo = await Todos.findByIdAndUpdate(
			{_id: todoId, userId: req.userId},
			req.body, 
			{
				new: true,
				runValidators: true,
			}
		);
		if (!updatedTodo) {
			return res.status(404).json({ error: "Todo not found or not yours" });
		}

		res.status(200).json({ status: "success", data: updatedTodo });
	} catch (err) {
		res.status(500).json({ error: `` });
	}
});


//Delete Todo
app.delete("/todo/:id", async (req, res) => {
	try{
		const todoId = req.params.id;

		const todo = await Todos.findByIdAndDelete({_id: todoId, userId: req.userId},);

		if (!todo) {
			return res
				.status(404)
				.json({ error: `The todo with id: ${todoId} is not found` });
		}
		res.status(200).json({ status: "success", message: "Deleted" });
	} catch (err) {
		console.log("Error in Delete todo route: ", err.message);
		return res.status(500).json({ status: "Failure", message: "Something went wrong. Please try again later" });
	}
});


app.post('/register', async (req, res) => {
	try{
		let {name, email, password} = req.body;

		name = name?.trim();
        email = email?.trim();
        password = password?.trim();

		if(!name || !email || !password){
			return res.status(400).json({status: "Failure", message: "Required payload is missing"})
		}

		
		const existingUser = await Users.findOne({email});
		if(existingUser){
			return res.status(400).json({status: "Failure", message: "Email already exists"})
		}

		const hashedPassword = await bcrypt.hash(password, 10); // Use for hashing password

		const newUser = new Users({
			name, email, password: hashedPassword
		})

		await newUser.save();

		res.status(201).json({status: "Success", message: "User is successfully resgistered"});
	}
	catch(err){
		 res.status(500).json({status: "Failure", message: err.message})
	}
})


app.post('/login',async (req, res)=>{
	try{
		let {email, password} = req.body;

		//to remove extra white spaces
        email = email?.trim();
        password = password?.trim();

		if(!email || !password){
			return res.status(400).json({status: "Failure", message: "Required payload is missing"})
		}
		
		const existingUser = await Users.findOne({email});
		if(!existingUser){
			return res.status(400).json({status: "Failure", message: "User does not exists"})
		}

		//Compare using bcrypt 
		const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch) {
            return res.status(401).json({ status: "Failure", message: "Invalid credentials" });
        }
		else{
			const token = base64.encode(`${email}:${password}`);
			res.status(201).json({status: "Success", message: "Login successful", token});
		}
	
	}
	catch(err){
		 res.status(500).json({status: "Failure", message: err.message})
	}
})

// --- Middleware ---
app.use((req, res) => {
	res.status(404).json({
		error: "Route not found",
		path: req.originalUrl,
		method: req.method,
	});
});

app.use((err, req, res, next) => {
	console.error("Internal Server Error:", err.stack);
	res.status(500).json({
		error: "Internal Server Error",
		details: err.message,
	});
	next()
});

// --- Start Server ---
app.listen(process.env.PORT , () => {
	console.log("Listening to port 3000");
});
