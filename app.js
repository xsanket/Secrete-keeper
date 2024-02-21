//jshint esversion:6

require('dotenv').config()
const md5 = require('md5');

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;

// creating a session
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended:true
}));

// session
app.use(session({
    secret: "my big fat secret",
    resave: false,
    saveUninitialized: false
})); 
app.use(passport.initialize());
app.use(passport.session());




//mongoose.connect("mongodb://localhost:27017/userDB");
mongoose.connect("mongodb://127.0.0.1:27017/userDB");
// mongoose.set("useCreateIndex", true);


// creating object of mongoose schema to encript user password
const userSchema= new mongoose.Schema({
    email: String ,
    password: String
}); 


userSchema.plugin(passportLocalMongoose);

// userSchema.plugin(encrypt, { secret:process.env.SECRET , encryptedFields: ["password"]});
// collection user
const User = new mongoose.model("User", userSchema);

// writting serialization and deserialization to conver object int o byte stream and vice versa
passport.use(User.createStrategy());
//passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get("/", function(req, res){
    res.render("home");
});

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

// if user already logged in then let him athenticate(using cookies)

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login")
    }
});

// post for reg page

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){

        if(err){
            
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});


app.post("/login", function(req, res){
    const username = req.body.username;
    const password = req.body.password;

    // User.findOne({email:username})
    // .then((foundUser)=>{
    //     if(foundUser){
    //         bcrypt.compare(password, foundUser.password, function(err, result) {
    //             if(result === true){
    //                 res.render("secrets");
    //             }
    //         });
            
    //     }
    //     else{
    //         res.send("Invalid credentials");
    //     }
       
        
    // }) 
    // .catch((err)=>{
    //     console.log(err);
    //     res.send(err);
    // })

});















app.listen(3000, function(){
    console.log("server is running");
} );