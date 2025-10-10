const Post = require("../models/Post");
const { invalidatePostCache } = require("../utils/invalidate-cache");
const logger = require("../utils/logger");
const { validateCreatePost } = require("../utils/validation");

const createPost = async (req, res) => {
  logger.info("Create post endpoint hit");
  const { error } = validateCreatePost(req.body);
  if (error) {
    logger.warn("Validation error, ", error.details[0].message);
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  try {
    const { content, mediaIds } = req.body;
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();
    await invalidatePostCache(req, newlyCreatedPost._id.toString());
    logger.info("Post created successfully", newlyCreatedPost);
    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};

const getAllPost = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachePosts = await req.redisClient.get(cacheKey);

    if (cachePosts) {
      return res.json(JSON.parse(cachePosts));
    }

    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const totalNoOfPosts = await Post.countDocuments();

    const result = {
        posts,
        currentpage: page,
        totalPages: Math.ceil(totalNoOfPosts / limit),
        totalPosts: totalNoOfPosts
    }

    // save your posts in redis cache
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    logger.error("Error fetching post", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post",
    });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const cacheKey = `post:${postId}`
    const cachePost = await req.redisClient.get(cacheKey);

    if (cachePost) {
      return res.json(JSON.parse(cachePost));
    }

    const singlePostDetailsId = await Post.findOne({_id: postId});
    
    if(!singlePostDetailsId) {
      return res.status(404).json({
        message: "Post not found",
        success: false 
      })
    }

    await req.redisClient.setex(cacheKey, 3600, JSON.stringify(singlePostDetailsId));

    res.json(singlePostDetailsId);

  } catch (error) {
    logger.error("Error fetching post", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};

const deletePost = async (req, res) => {
  try {

    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    })

    if(!post) {
      return res.status(404).json({
        message: "post not found",
        success: false
      })
    }

    await invalidatePostCache(req, req.params.id);

    res.json({
      message: "post deleted successfully",
      success: true
    });
  } catch (error) {
    logger.error("Error deleting post", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};

module.exports = { createPost, getAllPost, getPost, deletePost };
