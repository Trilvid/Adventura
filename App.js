const express   = require('express');
const morgan = require('morgan');
const cors = require('cors')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const helmet = require('helmet')
const createError = require('http-errors')
const story = require("./routes/storyRoute");
const auth = require("./routes/authRoute");
const comment = require("./routes/commentRoute");
const errorHandeler = require("./controllers/errorHandler")
const fileUpload = require('express-fileupload');
const path = require('path');

const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cors())
app.use(express.json({ limit: '10mb' }));
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static('public'));
app.use(cookieParser());
app.use(helmet())

// custom cors for using 2 ports cd
// app.use(cors({
//   origin: ['http://localhost:3000', 'http://localhost:4000'],
//   methods: 'GET,PATCH,POST,DELETE',
//   credentials: true 
// }));

app.set('view engine', 'ejs');

// app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
  });

// app.use('/uploads', express.static('uploads'));

// 2) Error handler middleware
app.get('/', (req, res, next) => {
  // Generate a 404 error
  res.status(404).send('hey there was an error')
  next(createError(404));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send(err.message);
});

// 3) Routes
app.use('/api/v1/stories', story);
app.use('/api/v1/auth', auth);
app.use('/api/v1/comment', comment);

app.use(errorHandeler)

app.all('*', (req, res, next) => {
  res.status(404).send(`Can't find ${req.originalUrl} on this server!`)
  return next();
});


module.exports = app;