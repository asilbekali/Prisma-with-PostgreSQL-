const { Router } = require("express");
const logger = require("../logger");
const { PrismaClient } = require("@prisma/client");
const { roleMiddleware } = require("../middleware/aotuh-role.middleware");

const prisma = new PrismaClient();
const router = Router();

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product management
 */

/**
 * @swagger
 * /product:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Smartphone
 *               price:
 *                 type: integer
 *                 example: 500
 *               categoryId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Product created successfully
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
 *                   example: Smartphone
 *                 price:
 *                   type: integer
 *                   example: 500
 *                 categoryId:
 *                   type: integer
 *                   example: 1
 *       500:
 *         description: Error in creating product
 */
router.post("/", roleMiddleware(["admin"]), async (req, res) => {
    try {
        const newProduct = await prisma.produc.create({ data: req.body });
        res.send(newProduct);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in create product" });
        logger.log("error", "Error in create product");
    }
});

/**
 * @swagger
 * /product:
 *   get:
 *     summary: Get all products with filtering, pagination, and search
 *     tags: [Product]
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
 *           example: Smartphone
 *         description: Filter products by name (case-insensitive)
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
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
 *                         example: Smartphone
 *                       price:
 *                         type: integer
 *                         example: 500
 *                       categoryId:
 *                         type: integer
 *                         example: 1
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
 *         description: Error in retrieving products
 */
router.get("/", async (req, res) => {
    try {
        const { page = 1, limit = 10, name } = req.query;
        const skip = (page - 1) * limit;

        const where = name
            ? {
                  name: {
                      contains: name,
                      mode: "insensitive",
                  },
              }
            : {};

        const products = await prisma.produc.findMany({
            where,
            skip: parseInt(skip),
            take: parseInt(limit),
        });

        const total = await prisma.produc.count({ where });

        res.send({
            data: products,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in get products" });
        logger.log("error", "Error in get products");
    }
});

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
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
 *                   example: Smartphone
 *                 price:
 *                   type: integer
 *                   example: 500
 *                 categoryId:
 *                   type: integer
 *                   example: 1
 *       404:
 *         description: Product not found
 *       500:
 *         description: Error in retrieving product
 */
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.produc.findUnique({
            where: { id: parseInt(id) },
        });
        if (!product) {
            return res.status(404).send({ message: "Product not found" });
        }
        res.send(product);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in get product by ID" });
        logger.log("error", "Error in get product by ID");
    }
});

/**
 * @swagger
 * /product/{id}:
 *   patch:
 *     summary: Update a product by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Smartphone
 *               price:
 *                 type: integer
 *                 example: 600
 *               categoryId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Error in updating product
 */
router.patch("/:id", roleMiddleware(["admin", "super-admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProduct = await prisma.produc.update({
            where: { id: parseInt(id) },
            data: req.body,
        });
        res.send(updatedProduct);
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in update product" });
        logger.log("error", "Error in update product");
    }
});

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Error in deleting product
 */
router.delete("/:id", roleMiddleware(["admin"]), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.produc.delete({ where: { id: parseInt(id) } });
        res.send({ message: "Product deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error in delete product" });
        logger.log("error", "Error in delete product");
    }
});

module.exports = router;