/**********************************************************************************************
 ** WEB422 – Assignment 6
 * I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
 * No part of this assignment has been copied manually or electronically from any other source
 * (including web sites) or distributed to other students. * 
 * 
 * Name: Edgar David Garcia Torres  Student ID: 104433206  Date: 05/08/2022
*
* Angular App (Deployed) Link: https://imaginative-panda-ac45aa.netlify.app
*
* User API (Heroku) Link: 
* *******************************************************************************************/

const express = require('express');
const cors = require("cors");
const userService = require("./user-service.js");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
const HTTP_PORT = process.env.PORT || 8080;
app.use(express.json());
app.use(cors());


// JSON Web Token Setup
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
// Configure its options
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
jwtOptions.secretOrKey = process.env.JWT_SECRET;

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
  console.log('payload received', jwt_payload);

  if (jwt_payload) {
    // The following will ensure that all routes using 
    // passport.authenticate have a req.user._id, req.us er.userName, req.user.fullName & req.user.role values 
    // that matches the request payload data
    next(null, {
      _id: jwt_payload._id,
      userName: jwt_payload.userName,
      fullName: jwt_payload.fullName,
      role: jwt_payload.role
    });
  } else {
    next(null, false);
  }
});
// tell passport to use our "strategy"
passport.use(strategy);

// add passport as application-level middleware
app.use(passport.initialize());

/* TODO Add Your Routes Here */

app.get("/", function (req, res) {
  res.send({ message: "API Listening" });
});

//REGISTER USER 
app.post("/api/user/register", (req, res) => {
  console.log(" info received is: ", req.body);
  userService.registerUser(req.body).then(() => {//provide req body as simple parameter
    res.status(200).json(`User registered successfully`);
    console.log("User registered successfully");
  }).catch((err) => {
    res.status(422).json(err);
    console.log("Error registering user ", err);
  })
})

//RETRIEVE USER 
app.post("/api/user/login", (req, res) => {//validates user, generates token to be sent 
  userService.checkUser(req.body).then((user) => {
    console.log("User retrieved : ", user)
    //GENERATE PAYLOAD OBJECT wih prop _id and userName
    var payload = {
      _id: user._id,
      userName: user.userName,
    };
    //SIGN THE PAYLOAD using the jwt module(jsonwebtoken)
    var token = jwt.sign(payload, jwtOptions.secretOrKey);
    //SEND THE JSON FORMATTED OBJECT BACK TO THE CLIENT
    res.status(200).json({ "message": "login successful", "token": token });//message + token
    console.log("User retrieved successfully");
  }).catch((err) => {
    res.status(422).json(err);
    console.log("Error retrieving user:  ", err);
  })
})


//GET FAVOURITES
app.get("/api/user/favourites", passport.authenticate('jwt', { session: false }), (req, res) => { // protected using the passport.authenticate() middleware
  userService.getFavourites(req.user._id).then(data => {
    res.status(200).json(data);
  }).catch(err => {
    console.log("failed at retrieving favorites: ", err);
    res.status(422).json(err);
  });
})

//DELETE removing a specific favourite  by id
app.delete("/api/user/favourites/:id", passport.authenticate('jwt', { session: false }), (req, res) => { //(protected using the passport.authenticate() middleware
  userService.removeFavourite(req.user._id, req.params.id).then((data) => {
    res.status(200).json(data);
  }).catch(err => {
    console.log("Attempt to delete failed ");
    res.status(422).json(err);
  });
})

//ADD SPECIFIC FAVORITE 
app.put("/api/user/favourites/:id", (req, res) => {
  userService.addFavourite(req.body.params.user._id, req.body.params.id).then(data => { //id route parameter as the second parameter.
  }).then((data) => {
    res.status(200).json(data);
  }).catch(err => {
    console.log("Attempt to update failed ");
    res.status(422).json(err);
  });
})

// ------------------------------------------------------------------------------------------
userService.connect()
  .then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });

module.exports = app;