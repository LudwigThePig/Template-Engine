'use strict';
const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const pug = require('pug');
const session = require('express-session');
const passport = require('passport');
const mongo = require('mongodb').MongoClient;
const LocalStrategy = require('passport-local');

const app = express();
app.set('view engine', 'pug');

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use(passport.initialize());
app.use(passport.session());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
}));

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next();
  }
  res.redirect('/');
};

app.route('/')
  .get((req, res) => {
  res.render(process.cwd() + '/views/pug/index', {title: 'Home Page', message:'Please login', showLogin: true});
  });
app.route('/login')
  .post(passport.authenticate('local', { failureRedirect: '/' }), (req, res)=>{
  res.redirect('/profile')
});
app.route('/profile')
  .get(ensureAuthenticated, (req,res) => {
       res.render(process.cwd() + '/views/pug/profile', {username: req.user.username});
  });
app.route('/logout')
  .get((req, res)=>{
    req.logout();
    res.redirect('/');
})
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});


const ObjectId = require('mongodb').ObjectID
mongo.connect(process.env.DATABASE, (err, db) => {
    if(err) {
        console.log('Database error: ' + err);
    } else {
        console.log('Successful database connection');

        //serialization and app.listen
      passport.serializeUser((user, done)=>{
        done(null, user._id);
      });
  passport.use(new LocalStrategy(
    (username, password, done)=>{
      db.collection('users').findOne({username: username}, (err, user)=>{
        console.log(`User ${username} attempted to login`);
        if (err) return done(err);
        if (!user) return done(null, false);
        if (password !== user.password) return done(null, false);
        return done(null, false);
      })
    }
  ));
}});



passport.deserializeUser((id, done)=>{
  db.collections('users').findOne(
    {_id: new ObjectId(id)}, (err, doc)=>{
      done(null, doc);
    }
  )
});


app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT);
});
