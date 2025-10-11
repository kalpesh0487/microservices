const express = require('express');
const multer = require('multer');

const { uploadMedia } = require('../controllers/media-controller');
const { authenticateRequest } = require('../middlewares/auth-middleware');

const logger = require('../utils/logger')

const router = express.Router();

// configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    }
}).single('file');

router.post('/upload', authenticateRequest, (req, res, next) => {
    console.log('Reached til api endpoint hit', req.file);
    upload(req, res, function(error){
        if(error instanceof multer.MulterError) {
            logger.error('Multer error while upload: ', error);
            return res.status(400).json({
                message: 'Multer error while upload',
                error: error.message,
                stack: error.stack
            });
        }
        else if(error) {
            logger.error('Unknown error occured while uploading: ', error);
            return res.status(500).json({
                message: 'Unknown error occured while uploading: ',
                error: error.message,
                stack: error.stack
            });
        }

        if(!req.file) {
            return res.status(400).json({
                message: 'No file found!',
                success: false
            });
        }
        next();
    })
    console.log('Reached til api endpoint hit and done and entering controller');
}, uploadMedia);

module.exports = router;