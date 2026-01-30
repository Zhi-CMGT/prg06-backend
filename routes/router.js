import express from "express";
import ChinaDrama from "../modes/dramaSchema.js";
import {faker} from "@faker-js/faker";

const router = express.Router();

router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    if (req.method === "OPTIONS") {
        return next();
    }
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
        next();
    } else {
        res.status(406).json({message: "Webservice only support json. Did you forget the Accept header?"});
    }
});

router.options("/", (req, res) => {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Allow", "GET, POST, OPTIONS");
    res.status(204).send();
});

router.get("/", async (req, res) => {

    //filter
    const query = {};
    if (req.query.genre) {
        query.genre = req.query.genre;
    }
    if (req.query.releaseYear) {
        query.releaseYear = req.query.releaseYear;
    }

    //paginering
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit);

    if (page < 1) page = 1;

    let dramas;
    let totalItems;
    let totalPages;
    let isPaginated = !isNaN(limit) && limit > 0;

    try {
        totalItems = await ChinaDrama.countDocuments(query);

        if (isPaginated) {
            totalPages = Math.ceil(totalItems / limit);

            if (page > totalPages && totalPages > 0) {
                page = totalPages;
            }

            dramas = await ChinaDrama.find(query, 'title englishTitle releaseYear')
                .skip((page - 1) * limit)
                .limit(limit);
        } else {
            dramas = await ChinaDrama.find(query, 'title englishTitle releaseYear');
            totalPages = 1;
            page = 1;
        }
        const buildUrl = (pageNum, limitNum = null) => {
            const params = new URLSearchParams();

            if (req.query.genre) params.append('genre', req.query.genre);
            if (req.query.releaseYear) params.append('releaseYear', req.query.releaseYear);

            if (limitNum !== null) {
                params.append('page', pageNum);
                params.append('limit', limitNum);
            }

            const queryString = params.toString();
            return `${process.env.BASE_URI}/chinadramas${queryString ? '?' + queryString : ''}`;
        };

        const response = {
            items: dramas,
            _links: {
                self: {href: buildUrl(page, isPaginated ? limit : null)},
                collection: {href: `${process.env.BASE_URI}/chinadramas`}
            },
            pagination: {
                currentPage: page,
                currentItems: dramas.length,
                totalPages: totalPages,
                totalItems: totalItems,
                _links: {}
            }
        };

        if (isPaginated) {
            response.pagination._links = {
                first: {
                    page: 1,
                    href: buildUrl(1, limit)
                },
                last: {
                    page: totalPages,
                    href: buildUrl(totalPages, limit)
                },
                previous: page > 1 ? {
                    page: page - 1,
                    href: buildUrl(page - 1, limit)
                } : null,
                next: page < totalPages ? {
                    page: page + 1,
                    href: buildUrl(page + 1, limit)
                } : null
            };
        } else {
            response.pagination._links = {
                first: {
                    page: 1,
                    href: buildUrl(1)
                },
                last: {
                    page: 1,
                    href: buildUrl(1)
                },
                previous: null,
                next: null
            };
        }

        res.json(response);
    } catch (e) {
        res.status(500).json({message: e.message});
    }
});

router.post("/", async (req, res) => {
    if (!req.body
        || !req.body.title
        || !req.body.englishTitle
        || !req.body.genre
        || !req.body.episodes
        || !req.body.releaseYear
        || !req.body.cast) {
        return res.status(400).json({message: "All fields are required"});
    }
    try {
        const drama = new ChinaDrama(req.body);
        await drama.save();
        res.status(201).json(drama);
    } catch (e) {
        res.status(400).json({message: e.message});
    }
});

router.post("/seed", async (req, res) => {
    const amount = req.body.amount ?? 10;
    if (req.body.reset) {
        await ChinaDrama.deleteMany({});
    }
    const dramas = [];
    for (let i = 0; i < amount; i++) {
        const drama = new ChinaDrama({
            title: faker.book.title(),
            englishTitle: faker.book.title(),
            genre: [faker.book.genre()],
            episodes: faker.number.int({min: 10, max: 60}),
            releaseYear: faker.date.past({years: 10}).getFullYear(),
            cast: [faker.person.fullName(), faker.person.fullName()]
        });
        await drama.save();
        dramas.push(drama);
    }
    res.json(dramas);
});

router.options("/:id", (req, res) => {
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS");
    res.header("Allow", "GET, PUT, DELETE, OPTIONS");
    res.status(204).send();
});

router.get("/:id", async (req, res) => {
    try {
        const drama = await ChinaDrama.findById(req.params.id);
        if (drama) {
            res.json(drama);
        } else {
            res.status(404).send();
        }
    } catch (e) {
        res.status(404).send();
    }
});

router.put("/:id", async (req, res) => {
    if (!req.body
        || !req.body.title
        || !req.body.englishTitle
        || !req.body.genre
        || !req.body.episodes
        || !req.body.releaseYear
        || !req.body.cast) {
        return res.status(400).json({message: "All fields are required"});
    }

    try {
        const updatedDrama = await ChinaDrama.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (updatedDrama) {
            res.json(updatedDrama);
        } else {
            res.status(404).send();
        }
    } catch (e) {
        res.status(400).json({message: e.message});
    }
});

router.patch("/:id", async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({message: "Body cannot be empty"});
    }

    try {
        const updatedDrama = await ChinaDrama.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (updatedDrama) {
            res.json(updatedDrama);
        } else {
            res.status(404).send();
        }
    } catch (e) {
        res.status(400).json({message: e.message});
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const drama = await ChinaDrama.findByIdAndDelete(req.params.id);
        if (drama) {
            res.status(204).send();
        } else {
            res.status(404).send();
        }
    } catch (e) {
        res.status(404).send();
    }
});

export default router;