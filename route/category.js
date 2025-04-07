const { Router } = require("express");
const logger = require("../logger");
const { PrismaClient } = require("@prisma/client");
const { roleMiddleware } = require("../middleware/aotuh-role.middleware");

const prisma = new PrismaClient();
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Category management
 */

/**
 * @swagger
 * /category:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Electronics
 *               image:
 *                 type: string
 *                 example: photo.jpg
 *     responses:
 *       200:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Electronics
 *                 image:
 *                   type: string
 *                   example: image.jpg
 *       500:
 *         description: Error in creating category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error in create category
 */
router.post("/", roleMiddleware(["admin"]), async (req, res) => {
    try {
        const newCategory = await prisma.category.create({ data: req.body });
        res.send(newCategory);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in create category" });
        logger.log("error", "Error in create category");
    }
});

/**
 * @swagger
 * /category:
 *   get:
 *     summary: Get all categories with filtering, pagination, and search
 *     tags: [Category]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: The page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: The number of items per page
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *           example: Electronics
 *         description: Filter categories by name (case-insensitive)
 *     responses:
 *       200:
 *         description: List of categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: Electronics
 *                       description:
 *                         type: string
 *                         example: Category for electronic products
 *                       produc:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 101
 *                             name:
 *                               type: string
 *                               example: Smartphone
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *       500:
 *         description: Error in retrieving categories
 */
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10, name } = req.query; // Extract query parameters
        const skip = (page - 1) * limit; // Calculate the number of records to skip

        const where = name
            ? {
                  name: {
                      contains: name, // Filter by name (case-insensitive)
                      mode: "insensitive",
                  },
              }
            : {};

        const categories = await prisma.category.findMany({
            where,
            skip: parseInt(skip),
            take: parseInt(limit),
            include: {
                produc: true,
            },
        });

        const total = await prisma.category.count({ where }); // Get total count for pagination

        res.send({
            data: categories,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in get category" });
        logger.log("error", "Error in get category");
    }
});

/**
 * @swagger
 * /category/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: Electronics
 *                 description:
 *                   type: string
 *                   example: Category for electronic products
 *       404:
 *         description: Category not found
 *       500:
 *         description: Error in retrieving category
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
            include: {
                produc: true,
            },
        });
        if (!category) {
            return res.status(404).send({ message: "Category not found" });
        }
        res.send(category);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in get category by ID" });
        logger.log("error", "Error in get category by ID");
    }
});

/**
 * @swagger
 * /category/{id}:
 *   patch:
 *     summary: Update a category by ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Electronics
 *               image:
 *                 type: string
 *                 example: Updated image for electronic products
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Error in updating category
 */
router.patch("/:id",roleMiddleware(["admin", "super-admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        const updatedCategory = await prisma.category.update({
            where: { id: parseInt(id) },
            data: req.body,
            include: {
                produc: true,
            },
        });
        res.send(updatedCategory);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in update category" });
        logger.log("error", "Error in update category");
    }
});

/**
 * @swagger
 * /category/{id}:
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 *       500:
 *         description: Error in deleting category
 */
router.delete("/:id", roleMiddleware(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.category.delete({ where: { id: parseInt(id) } });
        res.send({ message: "Category deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in delete category" });
        logger.log("error", "Error in delete category");
    }
});

module.exports = router;
