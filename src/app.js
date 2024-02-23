import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// cors is used for cross origin request to take requests from the frontend.
app.use(cors({
    origin : process.env.CORS_ORIGIN,
}))
// we use app.use() for configuration settings.
//configuring to read JSON.
app.use(express.json({limit : "16kb"}));

// configuring for reading url encoded.
app.use(express.urlencoded({extended : true, limit : '16kb'}));

// configures the server to serve static files from the public directory.
app.use(express.static("public"));

// reading and stroing cookies effectively of the user.
app.use(cookieParser());

export default app;