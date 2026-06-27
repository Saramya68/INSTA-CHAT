import jwt from 'jsonwebtoken'
export const generateToken=(userId)=>{
 const token=jwt.generateToken({userId},process.env.JWT_SECRET)
 return token 
}