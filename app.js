const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const db = require('./config/db');

// Test DB
db.authenticate()
  .then(() => console.log('database connected'))
  .catch(err => console.log(err))

const app = express();

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// static folder
app.use(express.static("public"));

app.get('/', (req, res) => res.send('hello'));

app.use('/ads', require('./routes/ads'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`listening on port ${PORT}`));