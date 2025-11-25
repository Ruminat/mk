import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./db/connect";
import moodRoutes from "./routes/mood";
import userRoutes from "./routes/user";
import userSettingsRoutes from "./routes/userSettings";

dotenv.config();

export const app = express();
app.use(express.json());

app.use("/mood", moodRoutes);
app.use("/userSettings", userSettingsRoutes);
app.use("/user", userRoutes);

connectDB();
