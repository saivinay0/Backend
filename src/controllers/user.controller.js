import {asyncHandler} from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponce.js";
import jwt from"jsonwebtoken"

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser=asyncHandler(async(req,res)=>{
     const {fullname,email,username,password}=req.body

     if (
        [fullname, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})
const loginUser=asyncHandler(async(req,res)=>{
    const {email,username,password}=req.body
    if(!(username || email)){
        throw new ApiError(400,"username or email is required");
    }

    const user = await User.findOne({
        $or :[{email},{username}]
    })
    if (!user){
        throw new ApiError(404,"user doesn't exist")
    }
    const ispasswordvalid = await user.isPasswordCorrect(password)
    if (!ispasswordvalid){
        throw new ApiError(401,"Password incorrect")
    }
    const {accessToken,refreshToken} = await generateAccessAndRefereshTokens(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options ={
        httpOnly:true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})
const logoutuser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshaccesstoken=asyncHandler(async(req,res)=>{
    const incomingrefreshtoken=req.cookies.refreshToken || req.body.refreshToken
    if (!incomingrefreshtoken) throw new ApiError(401,"Unauthorised request")
    

    try {
        const decodedtoken=jwt.verify(
            incomingrefreshtoken,
            process.env.REFRESH_TOKEN_SECRET,
            
        )
        const user =await User.findById(decodedtoken?._id)
        if (!user) throw new ApiError(401,"Invalid refresh Token")
        if(incomingrefreshtoken !== user?.refreshToken){
            throw new ApiError(401,"Refresh toke is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken,newrefreshToken}=await generateAccessAndRefereshTokens(user._id)
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponce(
                200,
                {accessToken,refreshToken:newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,"Invalid refresh token")
        
    }


})






export {loginUser,registerUser,logoutuser,refreshaccesstoken}