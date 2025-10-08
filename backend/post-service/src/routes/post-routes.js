const express = require('express');
const { createPost } = require('../controllers/post-controller');
const { authenticateRequest } = require('../middlewares/auth-middleware');

const router = express();
// middleware -> this will tell if the user is auth user or not

router.use(authenticateRequest);

router.post('/create-post', createPost);

module.exports = router;