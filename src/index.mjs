import express from "express";
import authRouter from "./routes/authRouter.mjs";
import inventoryRouter from "./routes/inventoryRouter.mjs";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";




const app = express();



mongoose.connect('mongodb://localhost/inventory_users')
.then(()=> console.log("connected to database"))
.catch((err) => console.log(`Error: ${err}`));

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/inventory", inventoryRouter);





const PORT = 5000;
app.listen(PORT,() => {
    console.log(`server running on port ${PORT}`);
});