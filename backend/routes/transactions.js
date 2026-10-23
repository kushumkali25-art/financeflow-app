import express from "express";
import Transaction from "../models/Transaction.js";
import requireAuth from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
    const transactions = await Transaction.find({ user: req.userId }).sort({
        date: -1,
        createdAt: -1
    });

    res.json({ transactions });
});

router.post("/", async (req, res) => {
    try {
        const { date, category, amount, type, payment, note } = req.body;

        if (!date || !category || !amount || amount <= 0) {
            return res
                .status(400)
                .json({ message: "Please enter valid transaction details." });
        }

        const transaction = await Transaction.create({
            user: req.userId,
            date,
            category: category.trim(),
            amount,
            type: type === "income" ? "income" : "expense",
            payment: payment || "Other",
            note: note || ""
        });

        res.status(201).json({ transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Unable to add transaction." });
    }
});

router.delete("/:id", async (req, res) => {
    const transaction = await Transaction.findOneAndDelete({
        _id: req.params.id,
        user: req.userId
    });

    if (!transaction) {
        return res.status(404).json({ message: "Transaction not found." });
    }

    res.json({ message: "Transaction deleted successfully!" });
});

export default router;