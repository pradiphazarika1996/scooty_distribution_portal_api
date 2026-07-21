import sequelize from "../../config/sequelize";
import { DataTypes } from "sequelize";

const StudentLookup = sequelize.define(
  "StudentLookup",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    serial_no: {
      type: DataTypes.STRING,
    },
    district_code: {
      type: DataTypes.STRING,
    },
    district_name: {
      type: DataTypes.STRING,
    },
    institution_code: {
      type: DataTypes.STRING,
    },
    institution_name: {
      type: DataTypes.STRING,
    },
    institution_address: {
      type: DataTypes.STRING,
    },
    candidate_name: {
      type: DataTypes.STRING,
    },
    father_name: {
      type: DataTypes.STRING,
    },
    roll: {
      type: DataTypes.STRING,
    },
    number: {
      type: DataTypes.STRING,
    },
    registration_no: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    registration_session: {
      type: DataTypes.STRING,
    },
    total_marks: {
      type: DataTypes.STRING,
    },
    percentage: {
      type: DataTypes.STRING,
    },
    faculty: {
      type: DataTypes.STRING,
    },
    gender: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "student_lookup",
    timestamps: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["registration_no"],
      },
      {
        fields: ["roll", "number"],
      },
      // {
      //   fields: ["institution_code"],
      // },
    ],
  },
);

export default StudentLookup;
