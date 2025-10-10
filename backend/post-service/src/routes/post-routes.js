const express = require('express');
const { createPost, getAllPost, getPost, deletePost } = require('../controllers/post-controller');
const { authenticateRequest } = require('../middlewares/auth-middleware');

const router = express();
// middleware -> this will tell if the user is auth user or not

router.use(authenticateRequest);

router.post('/create-post', createPost);
router.get('/all-posts', getAllPost);
router.get('/:id', getPost);
router.delete('/:id', deletePost);

module.exports = router;