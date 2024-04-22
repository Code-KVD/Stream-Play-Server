import {v2 as cloudinary} from 'cloudinary';
          
cloudinary.config({ 
  cloud_name: 'backendprojectsridhar', 
  api_key: '532793346586138', 
  api_secret: 'Nfddy2cypxCaJcSJ2mcWE1XQ_ZQ' 
});

cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
  { public_id: "olympic_flag" }, 
  function(error, result) {console.log(result); });