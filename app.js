import express from"express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const saltRounds = 10;

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://0.0.0.0:27017/userDB");
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = new mongoose.model("User", userSchema);


app.route("/") 
    .get((req, res) => {
        res.render("home");
    })

app.route("/login")
    .get((req, res) => {
        res.render("login");
    })

    .post((req, res) => {
        const username = req.body.username;
        const password = req.body.password;

        User.findOne({email: username})
        .then((foundItem) => {
            if (foundItem) {
                bcrypt.compare(password, foundItem.password, function(err, result) {
                    if(result === true) {
                        res.render("secrets");
                    } else {
                        res.send("Incorrect password");
                    }
                })
            } else {
                res.send("User does not exist");
            }
        })
        .catch((err) => {
            console.log(err);
        });
    })

app.route("/register") 
    .get((req, res) => {
        res.render("register");
    })

    .post((req, res) => {
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
            const user = new User({
                email: req.body.username,
                password: hash
            });
            user.save()
            .then(() => {
                res.render("secrets");
            })
            .catch((err) => {
                res.send(err);
            }); 
        });
    })


app.listen(3000, () => {
    console.log("Server started on port 3000.");
});