import { Sequelize } from "sequelize";
import DB from "./database";

const sequelize = new Sequelize(DB.DATABASE, DB.USER, DB.PASSWORD, {
  host: DB.HOST,
  dialect: "mysql",
  logging: false,
  port: 3307,
  pool: {
    max: DB.pool.max,
    min: DB.pool.min,
    acquire: DB.pool.acquire,
    idle: DB.pool.idle,
  },
  timezone: DB.timezone,
  dialectOptions: {
    decimalNumbers: true,
  },
});

export default sequelize;
