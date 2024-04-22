import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
    fullname : {
        type : String,
        required : [true, 'fullname is required'],
        trim : true,
        index : true
    },
    avatar : {
        type : String, // cloudinary url
        required : true,
    },
    coverImage : {
        type : String, // cloudinary url
    },
    watchHistory : [
        {
            type : Schema.Types.ObjectId,
            ref : "Video" // to be added.
        }
    ],
    password : {
        type : String,
        required : [true, 'Password is required'],

    },
    refreshToken : {
        type : String 
    }
}, {timestamps : true});

// using pre middleware of mongoose.
userSchema.pre("save" , async function (next) {

    // Check if the field is modified.
    if(!this.isModified("password")){
        return next();
    }

    // hashing the password using bcrypt.
    this.password = await bcrypt.hash(this.password,10);
    //calling next to raise middleware flag.
    next();
});

// creating custom function to check if user entered password is correct or not.
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password,this.password);
}

// using custom fields for generating access token.
userSchema.methods.generateAccessToken = function(){
    jwt.sign({
        _id: this._id,
        email : this.email,
        username: this.username,
        fullname : this.fullname,
    },
    process.env.ACCESS_TOKEN_SCERET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}
// using custom function for generating refresh token.
userSchema.methods.generateRefreshToken = function(){
    jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SCERET,
    {
        expiresIn : process.env.REFRESH_TOKEN_SCERET
    }
    )
}

export const User = mongoose.model("User",userSchema);