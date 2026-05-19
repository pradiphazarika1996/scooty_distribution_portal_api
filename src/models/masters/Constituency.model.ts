import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";
import Village from "./Village.model";

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

Constituency.hasMany(Village, { foreignKey: "constituency_id" });
Village.belongsTo(Constituency, { foreignKey: "constituency_id" });

export default Constituency;
