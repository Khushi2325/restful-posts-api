const express = require('express');
const app = express();
const port = 8080;

const path = require('path');

app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

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
];

app.get("/posts",(req, res) =>{ //index route
    res.render("index.ejs", {posts});
})

app.listen(port, () => {
    console.log("listening on port 8080");
});