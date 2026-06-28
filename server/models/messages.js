import mongoose from 'mongoose'
const messageSchema=new mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        require:true,
        },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        require:true,
        },
    text:{
        type:String,
        },
    image:{
        type:String,
    },
    seen:{
        type:Boolean,
        default:false
    }

},{timestamps:true})
const Message=mongoose.model('message',messageSchema)
export default Message;