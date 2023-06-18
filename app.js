require('dotenv').config();
const express = require("express");
const bodyParser = require ("body-parser");
const ejs = require ("ejs");
const mongoose = require ("mongoose");
const session = require ("express-session");
const passport = require ("passport");
const passportLocalMongoose = require ("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook").Strategy;


const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "I am a beast",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://0.0.0.0:27017/userDB");
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    username: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({username: profile.displayName, googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
    function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({username: profile.displayName, facebookId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

app.route("/") 
    .get((req, res) => {
        res.render("home");
    })

app.get("/auth/google", passport.authenticate("google", {scope: ["profile"]}));
app.get("/auth/google/secrets", 
    passport.authenticate("google", { failureRedirect: "/login" }),
    function(req, res) {
        res.redirect("/secrets");
    });

app.get('/auth/facebook', passport.authenticate('facebook'));
app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/secrets');
    });

app.route("/login")
    .get((req, res) => {
        res.render("login");
    })

    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })
        req.login(user, (err) => {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                })
            }
        })
    })

app.route("/secrets")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("secrets");
        } else{
            res.redirect("/login")
        }
    })

app.route("/register") 
    .get((req, res) => {
        res.render("register");
    })

    .post((req, res) => {
        User.register({username: req.body.username}, req.body.password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local") (req, res, () => {
                    res.redirect("/secrets");
                });
            }
        })
    })

app.route("/logout")
    .get((req, res) => {
        req.logout((err) => {
            if (!err) {      
                res.redirect("/");
            }
        });
    })

app.listen(3000, () => {
    console.log("Server started on port 3000.");
});