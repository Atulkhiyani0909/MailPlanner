const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});




const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
      const isCSV = file.mimetype === 'text/csv'; // Check if the file is a CSV
      return {
          folder: 'Mailplanner',
          resource_type: isCSV ? 'raw' : 'image', // Use 'raw' for CSV and 'image' for others
          allowedFormats: isCSV ? ['csv'] : ['png', 'jpg', 'jpeg'], // Conditional formats
      };
  },
});

   

  module.exports ={
    cloudinary,
    storage,
  }