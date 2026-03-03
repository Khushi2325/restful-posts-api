const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
const Post = require('./models/post.js');
const mongoose = require('mongoose');
require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;

async function main(){
    await mongoose.connect(MONGO_URL);
}

main().then(() => {
    console.log("Connected to MongoDB");
}).catch(err => console.log(err));

const path = require('path');

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));


app.get("/", (req, res) => {
    res.redirect("/posts");
});
app.get("/posts", async (req, res) =>{ //index route
    let posts = await Post.find({});
    res.render("index.ejs", {posts});
});

app.get("/posts/new", (req, res) =>{ //new route
    res.render("new.ejs");
});

app.post("/posts", (req, res) =>{ //create route
    let {username, content} = req.body;
    let posts = new Post({username : username, content:content});

    posts.save().then(() => {
        console.log("Post saved to database");
    }).catch(err => console.log(err));  
    
    res.redirect("/posts");
});

app.get("/posts/:id", async (req, res) => {
    let {id} = req.params;
    console.log(id);
    let post = await Post.findById(id);
    res.render("show.ejs", {post});
});

app.patch("/posts/:id", async(req, res) => {
    let {id} = req.params;
    let newcontent = req.body.content;
    let post = await Post.findByIdAndUpdate(id, {content: newcontent}, {new: true});
    console.log(post);
    res.redirect("/posts");
});

app.get("/posts/:id/edit", async (req, res) => {
    let {id} = req.params;
    let post = await Post.findById(id);
    res.render("edit.ejs", {post});
});

app.delete("/posts/:id", async (req, res) => {
    let {id} = req.params;
    await Post.findByIdAndDelete(id);
    res.redirect("/posts");
});

app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});