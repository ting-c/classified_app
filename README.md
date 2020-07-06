## General info
A classified app where a user can search adverts posted by other users. 

### Features 
- Post adverts with a postcode and validation using an open API ([https://postcodes.io/](https://postcodes.io/))
- Upload images for adverts using multer middleware and stored in a free image hosting site ([https://imgbb.com/](https://imgbb.com/))
- Search adverts with sort and filter on price/distance features
- User Authentication using Passport.js
- Messaging system where user can send messages to the inbox of seller.

	
## Technologies
Project is created with:
* Handlebars - version 4.0.4
* Express - version 4.17.1
* Node JS - version 12.18.0
* Postgres - 7.12.1
	
## Setup
To run this project, install it locally by running `npm install`:

### Development mode

Run `npm dev` to run the app in the development mode with nodemon.<br />
Open [http://localhost:5000](http://localhost:5000) to view the server side in the browser.


### Deployment

This app is hosted on Heroku and connected to the Heroku Postgres database.

For more information on how to deploy on Heroku, visit 
[https://www.heroku.com](https://www.heroku.com)
[https://www.heroku.com/postgres](https://www.heroku.com/postgres)
