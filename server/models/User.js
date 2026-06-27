import mongoose from 'mongoose'
const UserSchema=new mongoose.Schema({
    email:{
        type:String,
        require:true,
        unique:true,
    },
    fullName:{
        type:String,
        require:true,
    },
    password:{
        type:String,
        required:true,
        minlength:6
    },
    profilePic:{
        type:String,
        default:"",
    },
    bio:{
        type:String,
    }

},{timestamps:true})
const User=mongoose.model('user',UserSchema)
export default User;