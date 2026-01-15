import express from "express";
import mongoose from "mongoose";
import router from "./routes/router.js";

const app = express();

app.use("/", router);

try {
    await mongoose.connect(process.env.EXPRESS_PORT);

    app.listen(process.env.EXPRESS_PORT, () => {
        console.log(`Server is listening on port ${process.env.EXPRESS_PORT}`);
    });

} catch (e) {
    app.use("/", (req, res) => {
        res.status(500).json({
            message: "Database is down, Sorry :-("
        })
    })
    console.log("Database connection failed");
}
