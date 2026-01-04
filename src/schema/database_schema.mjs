import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: mongoose.Schema.Types.String,
        required: true,

    },
    email: {
        type: mongoose.Schema.Types.String,
        required: true,
        unique: true,
    },
    password: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
    role: {
        type: mongoose.Schema.Types.String,
        enum: ["employee", "owner"],
        default: "employee",
        required: true,
    }
});

const refreshSchema = new mongoose.Schema({
    token: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    expiresAt: {
        type: mongoose.Schema.Types.Date,
        required: true,
    },
    revoked: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },

});

const inventoryschema = new mongoose.Schema({
    name: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
    price: {
        type: mongoose.Schema.Types.Number,
        required: true,
    },
    quantity: {
        type: mongoose.Schema.Types.Number,
        required: true,
    },
    expire: {
        type: mongoose.Schema.Types.Date,
        default: null,
    },
});

export const Inventory = mongoose.model("Inventory", inventoryschema);
export const UserToken = mongoose.model("UserToken", refreshSchema);
export const User = mongoose.model('User',userSchema);