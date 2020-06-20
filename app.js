const express = require('express');
const exphbs = require('express-handlebars');
const db = require('./config/db');

const { Pool } = require("pg");
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	ssl: {
		rejectUnauthorized: false,
	},
});

// Test DB
db.authenticate()
  .then(() => console.log('database connected'))
  .catch(err => console.log(err))

const app = express();

app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(express.urlencoded({ extended: false }));

// static folder
app.use(express.static("public"));

app.get('/', (req, res) => res.render('index', { layout: 'landing'}));

// heroku postgres
app.get('/db', async (req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM test_table');
      const results = { 'results': (result) ? result.rows : null};
      res.render('pages/db', results );
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  });
  
app.use('/ads', require('./routes/ads'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`listening on port ${PORT}`));