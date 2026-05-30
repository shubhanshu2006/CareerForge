import { prisma } from "./prisma.js";

export const connectDB = async () => {
  try {
    await prisma.$connect();

    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed", error);

    process.exit(1);
  }
};