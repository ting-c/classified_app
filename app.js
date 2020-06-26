const express = require('express');
const exphbs = require('express-handlebars');
const db = require('./config/db');
const path = require('path');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');

// Test DB
db.authenticate()
  .then(() => console.log('database connected'))
  .catch(err => console.log(err))

const app = express();

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false, // unmodified session not stored
  saveUninitialized: false, //new but unmodified session not stored.
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

// static folder
app.use(express.static(path.join(__dirname, 'public')));
app.use('/ads', express.static(path.join(__dirname, 'public')));

// middleware function to create a local user variable accessible in the view
app.use((req, res, next) => {
  app.locals.user = req.user;
  next()
});

app.get('/', (req, res) => {
  res.render('index', { 
    layout: 'landing'
  });
});
  
app.use('/ads', require('./routes/ads'));
app.use('/register', require('./routes/register'));
app.use('/login', require('./routes/login'));
app.delete('/logout', (req, res) => {
  req.logOut();
  res.redirect('/login');
})

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`listening on port ${PORT}`));
