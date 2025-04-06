const { Router } = require("express");
const logger = require("../logger")
const { PrismaClient } = require("@prisma/client");


const prisma = new PrismaClient();
const router = Router();

router.post("/", async (req, res) => {
    try {
        let newCategory = await prisma.category.create({data: req.body})
        res.send(newCategory)
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in create category" });
        logger.log("error", "Error in create category")
    }
});


module.exports = router