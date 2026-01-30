import express from "express";
import mongoose from "mongoose";
import router from "./routes/router.js";

const app = express();

app.use(express.json());

app.use("/chinadramas", router);
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to the China Drama API",
        _links: {
            self: {href: process.env.BASE_URI},
            collection: {href: `${process.env.BASE_URI}/chinadramas`}
        }
    });
});

try {
    await mongoose.connect(process.env.MONGODB_URI);

    app.listen(process.env.EXPRESS_PORT, () => {
        console.log(`Server is listening on port ${process.env.EXPRESS_PORT}`);
    });

} catch (e) {
    console.error("Database connection failed:", e);
    app.use((req, res) => {
        res.status(503).json({
            message: "Service Unavailable: Could not connect to the database."
        });
    });
}
