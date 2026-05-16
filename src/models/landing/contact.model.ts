import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";

const Contact = sequelize.define(
  "contact",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "reviewed", "resolved"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    timestamps: true,
    underscored: true,
  }
);

export default Contact;