const { totp } = require("otplib");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const DeviceDetector = require("device-detector-js");
const deviceDetector = new DeviceDetector();
const sendEmail = require("../config/sendemail");
const { Router } = require("express");
const { authMiddleware } = require("../middleware/aotuh-role.middleware");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const router = Router();

function genToken(user) {
    const token = jwt.sign(
        { id: user.id, role: user.role, status: user.status },
        "apex1",
        { expiresIn: "40m" }
    );
    return token;
}

function genRefreshToken(user) {
    const token = jwt.sign({ id: user.id }, "apex2", { expiresIn: "14d" });
    return token;
}

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication routes
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               name:
 *                 type: string
 *                 example: John Doe
 *               role: 
 *                 type: string
 *                 example: admin 
 *     responses:
 *       200:
 *         description: OTP sent to the user's email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Otp sended to your email
 *       500:
 *         description: Internal server error
 */
router.post("/register", async (req, res) => {
    try {
        const { email, password, phone, name, role} = req.body;
        const otp = totp.generate(email + "stakan");
        const hash = bcrypt.hashSync(password, 10);
        const newUser = await prisma.user.create({
            data: {
                email: email,
                password: hash,
                status: "pending",
                phone: phone,
                name: name,
                role: role
            },
        });

        console.log(otp);
        sendEmail(email, name, otp);

        logger.log("info", `New user registered - ${email}`);
        res.send({ message: "Otp sended to your email" });
    } catch (error) {
        console.log(error);
        logger.error("Error to register user");
        res.status(500).send({ message: "Something went wrong" });
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 refresh_token:
 *                   type: string
 *                   example: some_refresh_token
 *                 access_token:
 *                   type: string
 *                   example: some_access_token
 *       404:
 *         description: User not found
 *       401:
 *         description: Password is incorrect
 *       500:
 *         description: Internal server error
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const match = bcrypt.compareSync(password, user.password);
        if (!match) {
            return res.status(401).send({ message: "Password is incorrect" });
        }
        if (user.status === "pending") {
            return res.status(400).send({
                message: "Your account is not verified, please verify it.",
            });
        }

        const access_token = genToken(user);
        const refresh_token = genRefreshToken(user.email);

        logger.log("info", `User logged in - ${user.email}`);

        const device = deviceDetector.parse(req.headers["user-agent"]);

        const session = await prisma.session.findUnique({
            where: {
                user_id_ip: {
                    user_id: user.id,
                    ip: req.ip,
                },
            },
        });

        if (!session) {
            await prisma.session.create({
                data: {
                    user_id: user.id,
                    ip: req.ip,
                    device: `${device.os.name} ${device.os.version} ${device.device.type} ${device.device.name} ${device.device.brand}`,
                },
            });
        }

        res.send({ refresh_token, access_token });
    } catch (error) {
        console.log(error);
        logger.error("Error logging in");
        res.status(500).send({ message: "Something went wrong" });
    }
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the authenticated user's information
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        res.send(user);
    } catch (error) {
        logger.error("Error retrieving user information:", error);
        res.status(500).send({ message: "Internal server error" });
    }
});

/**
 * @swagger
 * /auth/verify:
 *   post:
 *     summary: Verify a user's account using OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: User verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verified
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       400:
 *         description: OTP is invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Code is not valid or expired
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 */

router.post("/verify", async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await prisma.user.findFirst({
            where: { email },
        });

        console.log(user);

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const match = totp.verify({ token: otp, secret: email + "stakan" });
        if (!match) {
            return res
                .status(400)
                .send({ message: "Code is not valid or expired" });
        }

        await prisma.user.update({
            where: { email: email },
            data: {
                status: {
                    set: "Activited",
                },
            },
        });

        logger.log("info", `User verified - ${email}`);
        res.send({ message: "Verified" });
    } catch (error) {
        console.log(error);
        logger.error("Error to verify user");
        res.status(500).send({ message: "Something went wrong" });
    }
});

module.exports = router;

// oxriga yetgazib qoyish kerak l=register va logini korib chiqish kerak
