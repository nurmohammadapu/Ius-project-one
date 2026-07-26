const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();

exports.connect = async () => {
    try {
        await prisma.$connect();
        console.log("PostgreSQL Database Connected Successfully via Prisma");
    } catch (error) {
        console.log("DB Connection Failed");
        console.error(error);
    }
};

exports.prisma = prisma;

