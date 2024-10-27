import {Router} from "express";
import {registerUser,loginUser,logoutuser,refreshaccesstoken} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js";
import { verifyjwt } from "../middlewares/auth.middleware.js";
const router=Router()
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

router.route("/login").post(loginUser)

router.route("/logout").post(verifyjwt,logoutuser)
router.route.("/refreshtoken").post(refreshaccesstoken)
export default router