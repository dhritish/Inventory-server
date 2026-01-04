import express from "express";
import { Inventory } from "../schema/database_schema.mjs";




const router = express.Router();

router.post("/additem", async (request, response)=> {
    const {body} = request;
    if (!body) {
        return response.status(400).json({success: false, error: "No data provided"});
    }
    try {
        const res = await Inventory.findOne(body);
        if(res){
            await Inventory.findByIdAndUpdate(res._id, { $inc: { quantity: body.quantity } }, { runValidators: true });
            response.status(200).json({success: true});
        }else{
            const newitem = new Inventory(body);
            await newitem.save();
            response.status(200).json({success: true});
        }
    } catch (error) {
        response.status(400).json({success: false, error: "error adding item"});
    }
    
});

export default router;