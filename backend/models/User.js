import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
    {
        name: { type: String, default: "" },
        target: { type: Number, default: 0 }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: { type: String, required: true },
        gender: { type: String, default: "other" },
        photo: { type: String, default: "" },
        budget: { type: Number, default: 0 },
        goal: { type: goalSchema, default: () => ({}) }
    },
    { timestamps: true }
);

userSchema.methods.toSafeObject = function () {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        gender: this.gender,
        photo: this.photo,
        budget: this.budget,
        goal: this.goal,
        createdAt: this.createdAt
    };
};

export default mongoose.model("User", userSchema);