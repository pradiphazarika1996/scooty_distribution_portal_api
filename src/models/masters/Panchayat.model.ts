import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";

const Panchayat = sequelize.define(
  "panchayat",
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
      allowNull: false,
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

export default Panchayat;
