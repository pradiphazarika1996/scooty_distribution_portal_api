import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";
import { APPLICATION_STATUS } from "../../helpers/students/application";
const Student = sequelize.define(
  "Student",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    gender_id: {
      type: DataTypes.INTEGER,
    },
    father_name: {
      type: DataTypes.STRING,
    },

    mother_name: {
      type: DataTypes.STRING,
    },

    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

    // ── A. Personal Details (Annexure-I items 1-6) ──
    email: {
      type: DataTypes.STRING,
    },
    district_id: {
      type: DataTypes.INTEGER,
    },
    // ── B. Higher Secondary Examination Details (items 7-13) ──
    institution_name: {
      type: DataTypes.STRING,
    },
    institution_district: {
      type: DataTypes.INTEGER,
    },
    roll: {
      type: DataTypes.STRING,
    },
    number: {
      type: DataTypes.STRING,
    },
    registration_no: {
      type: DataTypes.STRING,
    },
    registration_session: {
      type: DataTypes.STRING,
    },
    percentage_of_marks: {
      type: DataTypes.DECIMAL(5, 2),
    },
    total_marks_obtained: {
      type: DataTypes.DECIMAL(6, 2),
    },
    remarks: { type: DataTypes.STRING },

    // ── C. Educational Details — conditional (items 14-17, 19-20) ──
    is_enrolled_in_college: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    present_institution_name: {
      type: DataTypes.STRING,
    },
    present_institution_district: {
      type: DataTypes.INTEGER,
    },
    admission_via_samarth: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    samarth_registration_no: {
      type: DataTypes.STRING,
    },
    is_betterment_reappearance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    betterment_years: {
      type: DataTypes.STRING,
    },
    betterment_reason: {
      type: DataTypes.TEXT,
    },

    // ── Application Progress & Status ──
    application_number: {
      type: DataTypes.STRING,
    },
    application_status: {
      type: DataTypes.INTEGER,
      defaultValue: APPLICATION_STATUS.DRAFT,
    },
    submitted_at: {
      type: DataTypes.DATE,
    },
    account_status: {
      type: DataTypes.TINYINT,
    },
    is_phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "students",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["phone"] },
      { fields: ["application_number"] },
    ],
  },
);

export default Student;
