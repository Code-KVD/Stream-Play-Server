import { Router } from "express";
import { loginUser, logoutUser, registerUser ,refreshAccessToken } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js";


const router = Router();

// the router object routes to register where we post request and here the control is given to the controller where all the logic has been given so as to how the data will be handled.
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser);

// secured routes.
router.route("/logout").post(verifyJwt,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);



export default router;