import express from "express";
import {User, UserToken} from "../schema/database_schema.mjs";
import { comparePassword, generate_access_token, generate_refresh_token, hashPassword, verifytoken_access, verifytoken_refresh } from "../middleware/auth_middleware.mjs";
import jwt from "jsonwebtoken";



const router = express.Router();

router.post("/signup", hashPassword, async (request, response)=> {
    console.log('this is signup route');
    const {body} = request;
    const newuser = new User(body);
    try {
        const saveduser = await newuser.save();
        response.status(200).json({success: true});
    } catch (error) {
        response.status(400).json({success: false, error: "error signing up user"});
    }
});

router.post("/signin",comparePassword, async (request, response) => {
    const { user } = request;
    const id = user._id;
    try{
        const access_token = generate_access_token(user);
        const refresh_token = generate_refresh_token(user);
        const date = new Date();
        date.setDate(date.getDate() + 7);
        const token_data = {
            token: refresh_token,
            user: id,
            expiresAt: date,
        }
        const new_refresh_token = new UserToken(token_data);
        await new_refresh_token.save();
        response.status(200).json({success: true,
            data: {access_token, refresh_token}});
    }catch(error){
        response.status(500).json({success: false,error: "error generating tokens or saving refresh token"});
    }
});

router.post("/signout", async (request, response) => {
    
    try{
        const auth = request.headers.authorization;
        const token = auth && auth.split(" ")[1];
        const usertoken = await UserToken.findOne({token: token});
        if(usertoken){
             await UserToken.findByIdAndUpdate(usertoken._id, {$set: {revoked: true}},{runValidators: true});
        response.status(200).json({success: true});
        }else{
            response.status(500).json({success: false, error: "error signing out user"});
        }
    }catch(error){
        response.status(500).json({success: false, error: "error signing out user"});
    }
});

router.post("/refresh", verifytoken_refresh, async (request, response) => {
    try{
        const auth = request.headers.authorization;
        const token = auth && auth.split(" ")[1];
        const usertoken = await UserToken.findOne({token: token});
        if(usertoken){
            if(usertoken.expiresAt > new Date() && usertoken.revoked === false){
                const decoded = jwt.decode(token);
                const user = await User.findById(decoded.id);
                if(user){
                    const access_token = generate_access_token(user);
                    await UserToken.findByIdAndUpdate(usertoken._id, {$set: {revoked: true}},{runValidators: true});
                    const refresh_token = generate_refresh_token(user);
                    const date = new Date();
                    date.setDate(date.getDate() + 7);
                    const token_data = {
                        token: refresh_token,
                        user: user._id,
                        expiresAt: date,
                    }
                    const new_tokend_data = new UserToken(token_data);
                    await new_tokend_data.save();
                    return response.status(200).json({success: true, data: {access_token,refresh_token}});
                }else{
                    return response.status(401).json({success: false, error: "user not authenticated"});
                }
            }else{
                return response.status(401).json({success: false, error: "user not authenticated"});
            
            }
                
        }else{
            return response.status(401).json({success: false, error: "user not authenticated"});
        }
    }catch(error){
        return response.status(500).json({success: false, error: "error refreshing token"});

        }
        
    }    );

export default router;