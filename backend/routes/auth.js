import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

function createToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });
}

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password, gender, photo } = req.body;

        if (!name || !email || !password || !gender) {
            return res
                .status(400)
                .json({ message: "Please fill all required fields." });
        }

        if (password.length < 4) {
            return res
                .status(400)
                .json({ message: "Password must contain at least 4 characters." });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res
                .status(409)
                .json({ message: "Account already exists. Please login." });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: passwordHash,
            gender,
            photo: photo || ""
        });

        const token = createToken(user._id);

        res.status(201).json({
            token,
            user: user.toSafeObject()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Signup failed. Please try again." });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Please enter email and password." });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = createToken(user._id);

        res.json({
            token,
            user: user.toSafeObject()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Login failed. Please try again." });
    }
});

router.get("/me", requireAuth, async (req, res) => {
    const user = await User.findById(req.userId);

    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: user.toSafeObject() });
});

router.put("/me", requireAuth, async (req, res) => {
    try {
        const { name, email, gender, photo, removePhoto } = req.body;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (email && email.toLowerCase().trim() !== user.email) {
            const duplicate = await User.findOne({
                email: email.toLowerCase().trim(),
                _id: { $ne: user._id }
            });

            if (duplicate) {
                return res
                    .status(409)
                    .json({ message: "This email is already used by another account." });
            }

            user.email = email.toLowerCase().trim();
        }

        if (name) user.name = name.trim();
        if (gender) user.gender = gender;
        if (removePhoto) user.photo = "";
        if (photo) user.photo = photo;

        await user.save();

        res.json({ user: user.toSafeObject() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to update profile." });
    }
});

router.put("/budget", requireAuth, async (req, res) => {
    const { budget } = req.body;

    if (typeof budget !== "number" || budget < 0) {
        return res.status(400).json({ message: "Budget cannot be negative." });
    }

    const user = await User.findByIdAndUpdate(
        req.userId,
        { budget },
        { new: true }
    );

    res.json({ user: user.toSafeObject() });
});

router.put("/goal", requireAuth, async (req, res) => {
    const { name, target } = req.body;

    if (!name || !target || target <= 0) {
        return res
            .status(400)
            .json({ message: "Please enter a goal name and target amount." });
    }

    const user = await User.findByIdAndUpdate(
        req.userId,
        { goal: { name, target } },
        { new: true }
    );

    res.json({ user: user.toSafeObject() });
});

export default router;