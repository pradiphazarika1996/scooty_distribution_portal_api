import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";
import Village from "./Village.model";

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
    // indexes: [{ fields: ["code"], unique: true }, { fields: ["district_id"] }],
  },
);

Panchayat.hasMany(Village, { foreignKey: "panchayat_id" });
Village.belongsTo(Panchayat, { foreignKey: "panchayat_id" });

export default Panchayat;
