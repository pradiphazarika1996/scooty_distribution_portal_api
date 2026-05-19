import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";

const Village = sequelize.define(
  "village",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    district_id: {
      type: DataTypes.INTEGER,
    },
    constituency_id: {
      type: DataTypes.INTEGER,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
  },
);

export default Village;
