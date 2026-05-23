import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";
import { PROFILE_STATUS } from "../../helpers/students/student";

const Student = sequelize.define(
  "Student",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // ── Auth & Account ──
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
    },
    role_id: {
      type: DataTypes.INTEGER,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    // ── Personal Details (filled once, reused across applications) ──
    name: {
      type: DataTypes.STRING,
    },
    avatar_url: {
      type: DataTypes.STRING,
    },
    guardian_name: {
      type: DataTypes.STRING,
    },
    gender_id: {
      type: DataTypes.INTEGER,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
    },
    caste_id: {
      type: DataTypes.INTEGER,
    },
    other_caste_name: {
      type: DataTypes.STRING,
    },
    aadhaar_number: {
      type: DataTypes.STRING(12),
    },

    // ── Address ──
    is_resident_of_mac_area: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    state_id: {
      type: DataTypes.INTEGER,
    },
    city: {
      type: DataTypes.STRING,
    },
    permanent_address: {
      type: DataTypes.STRING,
    },
    present_address: {
      type: DataTypes.STRING,
    },
    district_id: {
      type: DataTypes.INTEGER,
    },
    constituency_id: {
      type: DataTypes.INTEGER,
    },
    constituency_number: {
      type: DataTypes.INTEGER,
    },
    village_id: {
      type: DataTypes.INTEGER,
    },
    other_village_name: {
      type: DataTypes.STRING,
    },
    panchayat_name: {
      type: DataTypes.STRING,
    },
    municipal_area: {
      type: DataTypes.STRING,
    },
    pin_code: {
      type: DataTypes.STRING(6),
    },

    // ── Profile Status ──
    is_profile_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    profile_status: {
      type: DataTypes.INTEGER,
      defaultValue: PROFILE_STATUS.DRAFT,
    },
    profile_completed_at: {
      type: DataTypes.DATE,
    },
    is_profile_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // ── Verification ──
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_verified_at: {
      type: DataTypes.DATE,
    },
    is_phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    phone_verified_at: {
      type: DataTypes.DATE,
    },
    account_status: {
      type: DataTypes.TINYINT,
    },
  },
  {
    tableName: "students",
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ["phone"] },
      { fields: ["email"] },
      { fields: ["is_active"] },
    ],
  },
);

export default Student;
