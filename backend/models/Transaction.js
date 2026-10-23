import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        date: { type: String, required: true },
        category: { type: String, required: true, trim: true },
        amount: { type: Number, required: true },
        type: {
            type: String,
            enum: ["income", "expense"],
            required: true
        },
        payment: { type: String, default: "Other" },
        note: { type: String, default: "" }
    },
    { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);