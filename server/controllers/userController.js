import User from "../models/User";
import bcrypt from "bcryptjs"
import { generateToken } from "../lib/utils";
import cloudinary from '../lib/db.js'
// Signup a new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({
                success: false,
                message: "Missing Details"
            });
        }

        const user = await User.findOne({ email });

        if (user) {
            return res.json({
                success: false,
                message: "Account already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPasssword=await bcrypt.hash(password,salt)
        const newUser=User.create({
            fullName,email,password:hashedPasssword,bio
        })
        const token=generateToken(newUser._id)
        res.json({success:true,userData:newUser,token,message:'account created successfully'})

    } catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})

    }
};
// login 
export const login=()=>{
    try{
const {email,password}=req.body
const userData=await User.findOne({email})
const isPasswordCorrect= await bcrypt.compare(password,userData.password);
if(!isPasswordCorrect){
    return res.json({success:false,message:'invalid credintials'})
}
const token=generateToken(userData._id)
res.json({success:true,userData,token,message:'login successful'})

    }
    catch (error) {
        console.log(error.message)
        res.json({success:false,message:error.message})

    }
}
// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
};
// Controller to update user profile details 
export const updateProfile=async(req,res)=>{
   try{
     const {profilePic,bio,fullName}=req.body;
     const userId=req.user._id
     let updateUser
     if (!profilePic) {
    updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
    );
} else {
    const upload = await cloudinary.uploader.upload(profilePic);
     updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            profilePic: upload.secure_url,
            bio,
            fullName
        },
        { new: true }
    );
}

res.json({
    success: true,
    user: updatedUser
});

} catch (error) {
    console.log(error.message);

    res.json({
        success: false,
        message: error.message
    });
}

  }


