import { v2 as cloudinary } from 'cloudinary';
import config from '../app/config.js'; 

cloudinary.config({
  cloud_name: config.CLOUD_NAME, 
  api_key: config.CLOUD_API_KEY, 
  api_secret: config.API_SECRET
});

export default cloudinary;