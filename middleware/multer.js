const path = require('path');
const multer = require('multer');

// Configure storage for profile pictures
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'profile_pics');
        cb(null, uploadPath); // Ensure this path is correct
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // Generate a unique filename
    }
});

// Configure file filtering
const fileFilter = function(req, file, cb) {
    const filetypes = /image\/png|image\/jpeg|image\/jpg|image\/gif|image\/bmp|image\/webp|image\/avif/;
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype) {
        cb(null, true); // Allow file upload
    } else {
        cb(new Error('Only images are allowed'), false); // Reject file upload with an error
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

module.exports = upload;
