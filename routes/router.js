import express from "express";
import Note from "../modes/noteSchema.js";

const router = express.Router();

router.use((req, res, next) => {
    console.log("Check Accept header");

    if (req.headers.accept && req.headers.accept === "application/json") {
        next();
    } else {
        if (req.method === "OPTION") {
            next();
        } else {
            res.status(406).json({message: "Webservice only support json. Did you forget the Accept header?"})

        }
    }
});

router.get("/", async (req, res) => {
    const notes = await Note.find({});

    res.json(notes);
});

router.post("/seed", async (req, res) => {
    const notes = []

    await Note.deleteMany({});

    const amount = req.body?.amount ?? 10;

    for (let i = 0; i < amount; i++) {
        const note = Note({
            title: faker.lorem.sentence(),
            body: faker.lorem.paragraph(),
            author: faker.lorem.fullName()
        })

        note.save();
        note.push(note);
    }

    res.json(notes);
})

router.get("/id", async (req, res) => {
    const noteId = req.params.id;

    try {
        const note = await Note.findById(noteId);

        res.json(note);

    } catch (e) {
        res.status(404).send();
    }

})

export default router;