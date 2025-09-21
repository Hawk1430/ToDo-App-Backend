# ToDo API with User Authentication

A Node.js + Express + MongoDB ToDo API with user registration, login, and authorization.

## Features

-   User registration and login with password hashing (bcrypt)
-   Base64 token-based authentication
-   Create, read, update, delete todos
-   Each todo is linked to a specific user
-   Ownership check for update and delete

## Technologies

-   Node.js
-   Express.js
-   MongoDB + Mongoose
-   bcrypt
-   base-64

## Setup Instructions

1. **Clone the repository**

git clone <YOUR_REPO_URL>
cd <REPO_NAME>

2. **Install dependencies**

npm install

3. **Create a .env file**

MONGO_URL=your_mongodb_connection_string
PORT=3000

4. **Start the server**

npm start
