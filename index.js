const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/users');
const indexRoutes = require('./routes/index');

require('dotenv').config();

// Import and register models
require('./models/user');
require('./models/lottery');
require('./models/PasswordResetToken');

const app = express();

app.use(bodyParser.json());
app.use('/users', userRoutes);
app.use('/', indexRoutes);
app.set('view engine', 'ejs');
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('db connected');
  app.listen(process.env.PORT, () => console.log(`Server listening on port ${process.env.PORT}`));
}).catch((error) => {
  console.log(error);
  process.exit(1);
});
module.exports = app;