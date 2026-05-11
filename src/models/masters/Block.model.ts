import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";
import Cluster from "./Cluster.model";

const Block = sequelize.define(
  "block",
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
    //   allowNull: false,
    // },
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
    // indexes: [{ fields: ["code"], unique: true }, { fields: ["district_id"] }],
  },
);

Block.hasMany(Cluster, { foreignKey: "block_id" });
Cluster.belongsTo(Block, { foreignKey: "block_id" });

export default Block;
