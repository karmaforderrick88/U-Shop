import multer from "multer";
const storage = multer.memoryStorage()
const upload = multer({
    storage:storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter:(req,file,cb)=>{
        if(file.mimetype.startsWith('image/')){
            cb(null,true);
        }
        else{
            cb(new Error('Uploaded file type is not supported'), false);
        }
    }
});

export default upload;