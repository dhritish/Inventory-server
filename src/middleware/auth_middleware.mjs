import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../schema/database_schema.mjs";

export const access_token_secret = "this is access_token_secret";
export const refresh_token_secret = "this is refresh_token_secret";

const saltRounds = 10;

export const hashPassword = async (request, response, next) => {
    try {
        const { password } = request.body;
        const hash = await bcrypt.hash(password, saltRounds);
        request.body.password = hash;
        next();
    } catch (error) {
        response.status(500).json({ success: false,error: "Error hashing password" });
    }
}

export const comparePassword = async (request, response, next) => {
    try {
        const { password, email } = request.body;
        const user = await User.findOne({ email });
        if (!user) {
            return response.status(401).json({ success: false, error: "User not found" });
        }
        request.user = user;
        const match = await bcrypt.compare(password, user.password);
        if(!match){
            return response.status(401).json({ success: false,error: "Wrong password" });
        }
        next();
    } catch (error) {
        response.status(500).json({ success: false,error: "error comparing passwords" });
    }        
}

export const generate_access_token = (user) => {
    try {
        const {_id, role} = user;
        const token = jwt.sign({"id":_id, "role":role}, access_token_secret, { expiresIn: "1h" });
        return token;
    } catch (error) {
        console.log(error);
    }
};

export const generate_refresh_token = (user) => {
    try {
        const {_id} = user;
        const token = jwt.sign({"id":_id}, refresh_token_secret, { expiresIn: "7d" });
        return token;
    } catch (error) {
        console.log(error);
    }
};
        

export const verifytoken_access = (request, response, next) => {
    try {
        const authHeader = request.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if(!token){
            return response.status(401).json({ success: false,error: "user not authenticated" });
        };
        const verified = jwt.verify(token, access_token_secret);
        if(verified){
            next();
        }else{
            response.status(401).json({ success: false,error: "user not authenticated" });
        }
    } catch (error) {
        response.status(500).json({ success: false,error: "error verifying token" });
    }
    
}

export const verifytoken_refresh = (request, response, next) => {
    try {
        const authHeader = request.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        const verified = jwt.verify(token, refresh_token_secret);
        if(verified){
            next();
        }else{
            return response.status(401).json({ success: false,error: "user not authenticated" });
        }
    } catch (error) {
        return response.status(500).json({ success: false,error: "error verifying token" });
    
    }
};