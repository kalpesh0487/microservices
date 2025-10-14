require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");

const errorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");
const { connectRabbitMQ, consumeEvent } = require('./utils/rabbbitmq');
const searchRoutes = require('./routes/search-route');
const { handlePostCreated, handlePostDeleted } = require('./eventHandler/search-event-handler');

const app = express();
const PORT = process.env.PORT || 3004;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error, ", e));
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Received body ${req.body}`);
  next();
});

//TODO: here also same homework
// TODO: redis caching implement for search as well na 
app.use('/api/search', searchRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectRabbitMQ();

    // consume event / subscribe to events
    await consumeEvent('post.created', handlePostCreated);
    await consumeEvent('post.deleted', handlePostDeleted);

    app.listen(PORT, () => {
      logger.info(`Search service is running on port: ${PORT}`)
    })
  } catch (error) {
    logger.error(error, 'Failed to start search service.');
    process.exit(1);
  }
}

startServer();