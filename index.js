const express = require("express");
const { PrismaClient } = require("@prisma/client");
const AuthRoute = require("./route/auth")
const CategoryRoute = require("./route/category")
const swaggerDocs = require("./swager");
const app = express();
const prisma = new PrismaClient();

swaggerDocs(app);
app.use(express.json());

app.use("/auth", AuthRoute)
app.use("/category", CategoryRoute)


app.listen(8000, () => {
    console.log("Server started on 4000 port....");
});