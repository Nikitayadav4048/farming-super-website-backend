// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/farmers/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed'));
//   }
// };

// const farmerUpload = multer({
//   storage: storage,
//   limits: { fileSize: 5 * 1024 * 1024 },
//   fileFilter: fileFilter
// });

// module.exports = farmerUpload;

const multer = require('multer');
const path = require('path');
const fs = require('fs'); // 1. Import File System module

// Define the absolute path to the 'uploads/farmers' directory.
// path.join() is OS-safe, and '__dirname, ..' navigates up one folder 
// to assume 'uploads' is in the project root.
const uploadDir = path.join(__dirname, '..', 'uploads', 'farmers');

// 2. CRITICAL FIX: Check if the directory exists and create it if it doesn't.
if (!fs.existsSync(uploadDir)) {
    try {
        // { recursive: true } allows creating the 'farmers' folder inside 'uploads'
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log(`✅ Created upload directory: ${uploadDir}`);
    } catch (err) {
        console.error(`❌ CRITICAL ERROR: Could not create upload directory ${uploadDir}: ${err.message}`);
        // Optionally, re-throw the error or handle process exit
    }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // 3. Use the absolute path which is now guaranteed to exist
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    // Generate a unique filename (your existing logic is good)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Include fieldname for clarity (e.g., 'aadharFront-...')
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG/JPG/PNG) are allowed')); // Improved error message
  }
};

const farmerUpload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = farmerUpload;