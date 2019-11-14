const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const app = express();

// 引入uers.js
const users = require('./routers/api/user');
const profile = require('./routers/api/profile');

// DB config
const db = require('./config/keys').mongoURI;

// 使用body-parser中间件
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// passport初始化
app.use(passport.initialize());
require('./config/passport')(passport);

// Connect to Mongodb
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// app.get('/', (req, res) => {
//     res.send('hello word');
// })

// 使用routers
app.use('/api/users', users);
app.use('/api/profile', profile);

const port = process.env.PORT || 5003;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
