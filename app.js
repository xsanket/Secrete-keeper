//jshint esversion:6

require('dotenv').config()
const md5 = require('md5');

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

//mongoose.connect("mongodb://localhost:27017/userDB");
mongoose.connect("mongodb://127.0.0.1:27017/userDB");


// its like entity class
// creating object of mongoose schema to encript user password
const userSchema= new mongoose.Schema({
    email: String ,
    password: String
}); 



// userSchema.plugin(encrypt, { secret:process.env.SECRET , encryptedFields: ["password"]});


// collection user
const User = new mongoose.model("User", userSchema);



app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});


// post for reg page

app.post("/register", function(req, res){
      const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
      });
      newUser.save()
      .then(()=>{
          console.log("successfully registered");
          res.render("login");
      })

      .catch((err)=>{
        console.log(err);
        res.status(500).send(err);
      })

});


app.post("/login", function(req, res){
    const username = req.body.username;
    const password = md5(req.body.password);

    User.findOne({email:username})
    .then((foundUser)=>{
        if(foundUser){
           if(foundUser.password === password){
                res.render("secrets");
           }
           else{
            res.send("Invalid credentials");
        }
        }
        else{
            res.send("Invalid credentials");
        }
        
    })
    .catch((err)=>{
        console.log(err);
        res.send(err);
    })

});















app.listen(3000, function(){
    console.log("server is running");
} );