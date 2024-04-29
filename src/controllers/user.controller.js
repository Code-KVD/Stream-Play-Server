import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken =  async (userId) =>{
    try {
        
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validationBeforeSave : false});

        return {accessToken, refreshToken};


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token.")
    }
}

const registerUser = asyncHandler( async (req,res)=>{

    //Here we are dereferencing all the data which we get from req.body (body of the webpage).

    const {username, email, fullname,password} = req.body;
    console.log(req.body);
    // checking if the email is correctly used.

    // basic approach to solve the validation problem.
    // check if anyone of the field is empty.

    // if(username === ""){
    //     // if username is empty then throw error.
    //     throw new ApiError(400,"username is requrired");
    // }


    // More optimal approach.
    // here all the data is taken in the array and some function is applied which gives bool value.

    // if true then we throw the specific error.
    if(
        [username, email, fullname,password].some( (field) => field?.trim === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    // here we use the mongoose model to fetch the data from mongodb we used "findOne" function which fetches the data. here we have used or operators to check multiple fields like username or email.
    const existedUser = await User.findOne({
        $or : [{username} , {email}]
    });

    // here if the existedUser has value then we throw error as the username or email already connected with other user.
    if(existedUser){
        throw new ApiError(409,"username or email already exists")
    }

    // getting the local path of the avatar and cover image which has been uploaded using multer.
    const avatarLocalPath = req.files?.avatar[0]?.path
    // this wil generate error when we do not upload cover image.
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    // to solve the above bug we use the following approach...

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    
    
    // if avatar localpath does not exists then throw error.
    // console.log(avatarLocalPath);
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar field is required");
    }
    
    // console.log(avatarLocalPath);
    // storing the avatar and coverImage into clodinary and getting the json response of file.
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // if url does not exists then throw error.
    if(!avatar){
        throw new ApiError(400,"Avatar field is required cloud");
    }

    // uploading the data intot the database.

    // we use the mongodb user model with create method to upload data into mongodb.

    // here await is used to let the upload happen then move futher in the code.
    const user  =  await User.create({
        username : username.toLowerCase(),
        email,
        fullname,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        password
        
    });

    // here we are findind the created user from the mongodb by its id and removing the password and refreshToken from the response.
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    // Now returning the response with status code and in json format where we are using ApiResponse utils function.
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User successfully created!")
    )
});

const loginUser = asyncHandler(async (req,res) => {
    // todos...
    // request body --> data.
    //username or email --> check.
    // find the user
    // validate password
    // access and refresh token --> generate.
    // send token through cookies..

    const {username , email ,password} = req.body;
    // if username or email does not exists.
    if((!username && !email)){
        throw new ApiError(400,"username or email is required");
    }

    const user  = await User.findOne({
        $or : [{username}, {email}],
    })

    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    // checking password.
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    if(!accessToken && !refreshToken){
        throw new ApiError(500,"Access Token not generated");
    }


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");


    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,

            {
                user : loggedInUser,accessToken,refreshToken
            },

            "User Logged in Sucessfully"
        )
    )
});

const logoutUser = asyncHandler(async (req,res) =>{
    // remove cookies from frontend.
    // also update the refresh token in the database.
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.
    status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{},"User logged out Sucessfully"));
});

const refreshAccessToken = asyncHandler(async (req,res) =>{
    const clientRefreshToken = req.cookies.refreshToken || req.body.refreshToken;


    if(!clientRefreshToken){
        throw new ApiError(404 , "Refresh token not found");
    }

    try {
        const decodedToken = jwt.verify(clientRefreshToken, process.env.REFRESH_TOKEN_SCERET);

        const user = await User.findById(decodedToken._id);

        if(!user){
            throw new ApiError(404 , "user not found");
        }


        if(clientRefreshToken !== user.refreshToken){
            throw new ApiError(401,"Invalid refresh Token");
        }

        const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id);

        const options  = {
            httpOnly : true,
            secure : true
        }

        return res.
        status(200)
        .cookie("accessToken" , accessToken ,options)
        .cookie("refreshToken" , refreshToken ,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken
                },
                "Access token refreshed sucessfully"
            )
        )
    } catch (error) {
        throw new ApiError(400,  error?.message || "refresh Token not verified");
    }


});

const changeCurrentPassword = asyncHandler( async (req,res) => {

    const {oldPassword , newPassword} = req.body;

    const user = await User.findById(req.user?._id);

    if(!user){
        throw new ApiError(400 , "user not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid old Password");
    }

    user.password = password;

    await user.save({validationBeforeSave : false});


    return res.
    status(200)
    .json(new ApiResponse(
        200,
        {},
        "password changed",

    ))

});

const getCurrentUser = asyncHandler(async (req,res) =>{
    
    return res.
    status(200)
    .json(new ApiResponse(
        200,
       req.user,
       "current user fetched sucessfully"
    ))
});

const changeUserDetails = asyncHandler (async (req,res) =>{
    const {fullname , email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400, "All fields are required");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname,
                email : email
            }
        },
        {new : true}
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated Successfully"
    ));
});

const updateUserAvatar = asyncHandler(async (req, res) =>{
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar not found");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        throw new ApiError(200,"avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set : {
                avatar : avatar.url
            }
           
        },
        {new : true}
    ).select("-password");


    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar changed successfully"))
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const CoverImageLocalPath = req.file?.path;

    if(!CoverImageLocalPath){
        throw new ApiError(400 , "Cover Image not found");
    }

    const coverImage = await uploadOnCloudinary(CoverImageLocalPath);

    if(!coverImage?.url){
        throw new ApiError(200," Error uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set : {
                coverImage : coverImage.url
            }
           
        },
        {new : true}
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image changed successfully"))
});
export {    registerUser,
            loginUser,
            logoutUser,
            refreshAccessToken,
            changeCurrentPassword,
            getCurrentUser,
            changeUserDetails,
            updateUserAvatar,
            updateUserCoverImage
        };