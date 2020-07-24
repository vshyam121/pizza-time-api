const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const colors = require('colors');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const cors = require('cors');

//Load env vars
dotenv.config({ path: './config/config.env' });

//Connect to database
connectDB();

//Route files
const carts = require('./routes/carts');
const auth = require('./routes/auth');
const orders = require('./routes/orders');

const app = express();

//Body parser
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: 'https://localhost:3000',
    credentials: true,
  })
);

//Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Mount routers
app.use('/carts', carts);
app.use('/auth', auth);
app.use('/orders', orders);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

//Handle unhandled promise rejections
process.on('unhandledRejection', (error, promise) => {
  console.log(`Error: ${error.message}`.red);

  //Close server and exit process
  server.close(() => process.exit(1));
});
