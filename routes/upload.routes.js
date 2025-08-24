const express = require('express');
const router = express.Router();
const uploader = require('../config/cloudinary.config');

router.post('/upload', uploader.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded!' });
  }
  res.status(200).json({ fileUrl: req.file.path });
});

module.exports = router;