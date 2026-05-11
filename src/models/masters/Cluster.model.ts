import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";

const Cluster = sequelize.define(
  "cluster",
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
    // code: {
    //   type: DataTypes.STRING,
    // },
    district_id: {
      type: DataTypes.INTEGER,
    },
    constituency_id: {
      type: DataTypes.INTEGER,
    },
    block_id: {
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
    indexes: [
      // { fields: ["code"], unique: true },
      { fields: ["block_id"] },
      { fields: ["district_id"] },
    ],
  },
);

export default Cluster;
