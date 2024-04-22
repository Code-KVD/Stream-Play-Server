import multer from "multer";

const storage = multer.diskStorage({
    // where to store the file in server.
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    // What should be the filename.
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  })
  
export const upload = multer({ storage });