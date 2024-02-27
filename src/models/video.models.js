import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import bcrypt from "bcrypt";
import { Jwt } from "jsonwebtoken";

const videoSchema = new mongoose.Schema({

    videoFile : {
        type : String,
        required : [true, "video File is requried"],
    },
    thumbnail : {
        type : String,
        required : [true, "thumbnail is requried"],
    }, 
    title : {
        type : String,
        required : [true, "title is requried"],
    },
    description : {
        type : String,
        required : [true, "description is requried"],
    },
    duration : {
        type : Number,
        required : true,
    },
    views : {
        type : Number,
        required : true,
    },
    isPublished : {
        type : Boolean,
        required : true,
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true,
    },

},{timestamps : true});

// using mongoose plugin to use mongooseAggregatePaginate.
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);