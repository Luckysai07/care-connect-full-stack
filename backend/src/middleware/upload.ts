/**
 * Upload Middleware
 * Handles file uploads using Multer
 */

import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Configure storage
// We use memory storage so we can upload to S3 directly from the buffer
const storage = multer.memoryStorage();

// File filter (Images only)
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter,
});

export default upload;
