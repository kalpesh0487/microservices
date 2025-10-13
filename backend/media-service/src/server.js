require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
const helmet = require("helmet");
const mediaRoutes = require('./routes/media-routes');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const { connectRabbitMQ, consumeEvent } = require('./utils/rabbbitmq');
const { handlePostDeleted } = require('./eventHandlers/media-event-handlers');

const app = express();
const PORT = process.env.PORT || 3003;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error, ", e));
console.log('Reached til connection in media service')
app.use(cors());
app.use(helmet());
app.use(express.json());
console.log('Reached til aftr cors and express')

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Received body ${req.body}`);
  next();
});

// ***TODO Homework -: implement IP based rate limiting for sensitive endpoints

app.use('/api/media', mediaRoutes);

app.use(errorHandler);

async function startSerever() {
  try {
    await connectRabbitMQ();
    
    // consume all events
    await consumeEvent('post.deleted', handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Media service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to connect to server: ', error);
    process.exit(1);
  }
}

startSerever(); 

// unhandle promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at ', promise, "reason", reason)
});