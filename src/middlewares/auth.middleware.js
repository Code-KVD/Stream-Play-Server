import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";import jwt from "jsonwebtoken";



const verifyJwt = asyncHandler(async (req,res,next) =>{
    try {
        // step1 : get the access token from cookies or header.
        const token = req.cookies?.accessToken || req.header("Autherization")?.replace("Bearer ", "");
    
        // step2 : check if the token exists.
        if(!token){
            throw new ApiError(404, "Token not found");
        }
     
    
        // step 3 : verify the token using jwt.verify and store the information in a variable.
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SCERET);
    
        // now using decodedToken access the id and find the user using user ID and remove password nad refresh token.
        const user  = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        // if user is not found then throw error.
        if(!user){
            throw new ApiError(401 , "Invalid Access Token");
        }
    
        // now store the value of user to req.user.
        req.user = user;
    
        // now finally raise the next flag.
        next();
    } catch (error) {
        throw new ApiError(401, "Access Token not found");
    }
});

export {verifyJwt};