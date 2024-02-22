// It is the first step as soon as we run the program all the evironment variables should be available for every file.
import dotenv from "dotenv";
// give the full file name with extension to import connectDB.
import connectDB from "./db/index.js";

dotenv.config({
    path : './env'
})

connectDB();