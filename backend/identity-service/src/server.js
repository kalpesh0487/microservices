require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const { error } = require('winston');

mongoose
.connect(process.env.MONGO_URL)
.then(() => logger.info('Connected to mongodb'))
.catch(e => logger.error('Mongo connection error, ', error));

// middleware 

// 3:55:10