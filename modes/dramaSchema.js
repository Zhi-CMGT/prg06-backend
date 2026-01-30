import mongoose from "mongoose";

const chinaDramaSchema = new mongoose.Schema({
    title: {type: String, required: true},
    englishTitle: {type: String},
    genre: [{type: String}],
    episodes: {type: Number, required: true},
    releaseYear: {type: Number, required: true},
    cast: [{type: String}],
}, {

    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: (doc, ret) => {
            ret._links = {
                self: {
                    href: `${process.env.BASE_URI}/chinadramas/${ret._id}`
                },
                collection: {
                    href: `${process.env.BASE_URI}/chinadramas`,
                },
            };
            delete ret._id;
        },
    }
});

const ChinaDrama = mongoose.model("ChinaDrama", chinaDramaSchema);

export default ChinaDrama;
