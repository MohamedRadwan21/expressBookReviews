const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const books = require('./booksdb.js');
const regd_users = express.Router();

let users = [];

// Utility function to check if a username exists
const doesExist = (username) => {
    return users.some(user => user.username === username);
}

// Utility function to authenticate a user
const authenticatedUser = (username, password) => {
    return users.some(user => user.username === username && user.password === password);
}

// Session setup
regd_users.use(session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true
}));

// Login as a registered user
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(404).json({ message: "Username and password are required" });
    }
    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({ username }, 'your_jwt_private_key', { expiresIn: 60 * 60 });
        req.session.authorization = { accessToken, username };
        return res.status(200).json({ message: "User successfully logged in" });
    } else {
        return res.status(208).json({ message: "Invalid login. Check username and password" });
    }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review;
    const username = req.session.authorization.username;

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (!books[isbn].reviews) {
        books[isbn].reviews = {};
    }

    books[isbn].reviews[username] = review;
    return res.status(200).json({ message: "Review added/updated successfully", reviews: books[isbn].reviews });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username;

    if (!books[isbn] || !books[isbn].reviews || !books[isbn].reviews[username]) {
        return res.status(404).json({ message: "Review not found" });
    }

    delete books[isbn].reviews[username];
    return res.status(200).json({ message: "Review deleted successfully", reviews: books[isbn].reviews });
});

module.exports.authenticated = regd_users;
module.exports.users = users;
