import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";
import Block from "./Block.model";
import Cluster from "./Cluster.model";

const Constituency = sequelize.define(
  "constituency",
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
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    timestamps: true,
    underscored: true,
    // indexes: [{ fields: ["code"], unique: true }],
  },
);

Constituency.hasMany(Block, { foreignKey: "constituency_id" });
Block.belongsTo(Constituency, { foreignKey: "constituency_id" });

Constituency.hasMany(Cluster, { foreignKey: "constituency_id" });
Cluster.belongsTo(Constituency, { foreignKey: "constituency_id" });

export default Constituency;
