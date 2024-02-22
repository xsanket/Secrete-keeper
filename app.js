//jshint esversion:6

require('dotenv').config()
const md5 = require('md5');

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//google Oauth 
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    password: String,
    googleId: String,
    secret: String
}); 


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt, { secret:process.env.SECRET , encryptedFields: ["password"]});
// collection user
const User = new mongoose.model("User", userSchema);

// writting serialization and deserialization to conver object int o byte stream and vice versa
passport.use(User.createStrategy());
//passport.use(new LocalStrategy(User.authenticate()))
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// new passport seri and deser method for google ouath
passport.serializeUser(function(user, done) {
    done(null, user.id); 
  
});
passport.deserializeUser(function(id, done) {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            done(err, null);
        });
});


// passport-google-Outh
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/", function(req, res){
    res.render("home");
});

//GOOGLE Oauth
// app.get("/auth/google", function(req, res){
//     passport.authenticate("google", { scope: ['profile'] })
// })

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }
  ));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secret.
    res.redirect('/secrets');
  });







app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){
    res.render("register");
});

// if user already logged in then let him athenticate(using cookies)

app.get("/secrets", function(req, res) {
    User.find({"secret": {$ne: null}})
        .then((foundUser) => {
            if (foundUser) {
                res.render("secrets", { userWithSecrets: foundUser });
            } else {
                // No users found with secrets
                res.render("secrets", { userWithSecrets: [] });
            }
        })
        .catch((err) => {
            console.log(err);
            res.redirect("/");
        });
});


// get submit page 
app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login")
    }
});

//submit the secret
app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;

    console.log(req.user.id);

    User.findById(req.user.id)
    .then((foundUser)=>{
        
            if(foundUser){
                foundUser.secret=submittedSecret;
                foundUser.save()
                .then(()=>{
                    res.redirect("/secrets");
                })
                
            }
        
    })
    .catch((err)=>{
        console.log(err);
    })

});





app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err)
        }
        else{
            res.redirect("/");
        }
    });
    
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
    
    const user = new User({
        username: req.body.username,
       password: req.body.password
    });
  // .login() is a passport method
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
          
        }
    });


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