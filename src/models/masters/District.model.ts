import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";
import Constituency from "./Constituency.model";
import Village from "./Village.model";

const District = sequelize.define(
  "district",
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

District.hasMany(Constituency, { foreignKey: "district_id" });
Constituency.belongsTo(District, { foreignKey: "district_id" });

District.hasMany(Village, { foreignKey: "district_id" });
Village.belongsTo(District, { foreignKey: "district_id" });

export default District;
