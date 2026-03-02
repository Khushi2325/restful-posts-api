const mongoose = require('mongoose');
const Post = require('./models/post.js');

async function main(){
    await mongoose.connect('mongodb://127.0.0.1:27017/posts');
}

main().then(() => {
    console.log("Connected to MongoDB");
}).catch(err => console.log(err));

let posts = [
    {
        username: "Khushi",
        content: "Success is not final, failure is not fatal"
    },

    {
        username: "pathlylabs",
        content: "Tech is the future, embrace it!"
    },

    {
        username: "Siddhi",
        content: "Believe you can and you're halfway there."
    },

    {
        username: "Rohit",
        content: "The only way to do great work is to love what you do."
    },

    {
        username: "Anshul",
        content: "Don't watch the clock; do what it does. Keep going."
    },

    {
        username: "Aarav",
        content: "The future belongs to those who believe in the beauty of their dreams."
    },

    {
        username: "Nisha",
        content: "The only limit to our realization of tomorrow will be our doubts of today."
    },

];

Post.insertMany(posts);