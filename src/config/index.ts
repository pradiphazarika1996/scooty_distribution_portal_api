import dotenv from "dotenv";
dotenv.config();

export const { APP_PORT, APP_URL, DEBUG_MODE } = process.env;
