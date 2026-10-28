import "dotenv/config";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";import transactionRoutes from "./routes/transactions.js";
import userRoutes from "./routes/users.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());

app.use(express.json({ limit: "5mb" }));

app.use(express.static(path.join(__dirname, "../frontend")));


app.use("/api/auth", authRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/users", userRoutes);


app.get("/", (req, res) => {
    res.send("Backend server is working!");
});


app.get("/api/health", (req, res) => {
    res.json({
        status: "ok"
    });
});


const PORT = process.env.PORT || 5001;


mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:",error);
    });