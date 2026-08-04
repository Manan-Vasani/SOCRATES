const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { uploadToCloudinary } = require('../config/cloudinaryConfig');

const router = express.Router();

// Multer memory storage — files stay in memory buffer, never touch disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per file
    files: 10,                   // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
});

/**
 * POST /api/v1/upload/media
 * Upload one or more media files (images/videos) to Cloudinary
 * Returns array of { url, publicId, type }
 */
router.post('/media', protect, upload.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const results = [];

  for (const file of req.files) {
    const isVideo = file.mimetype.startsWith('video/');

    const uploaded = await uploadToCloudinary(file.buffer, {
      folder: 'socrates/community',
      resource_type: isVideo ? 'video' : 'image',
      transformation: isVideo
        ? undefined
        : [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
    });

    results.push({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      type: isVideo ? 'video' : 'image',
    });
  }

  res.json({ success: true, data: results });
});

module.exports = router;
