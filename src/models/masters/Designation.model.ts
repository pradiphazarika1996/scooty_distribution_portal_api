import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";

const Designation = sequelize.define(
  "designation",

  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    employment_type_id: {
      type: DataTypes.INTEGER,
    },
    category_type_id: {
      type: DataTypes.INTEGER,
    },
    parent_id: {
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

Designation.hasMany(Designation, {
  as: "subDesignations",
  foreignKey: "parent_id",
});

Designation.belongsTo(Designation, {
  as: "parentDesignation",
  foreignKey: "parent_id",
});

export default Designation;

// Non teaching staff
// Librarian, Assistant Librarian, Senior Assistant, Junior Assistant, Laboratory Assistant for Science Stream, Library Assistant, Laboratory Bearer for Science Stream, Grade-IV

// INSERT INTO `designations` (`id`, `name`, `employment_type_id`, `category_type_id`, `parent_id`, `is_active`, `created_at`, `updated_at`) VALUES
// (1, 'Head of Institution', NULL, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// (2, 'Vice Head of Institution', NULL, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// (3, 'Assistant Professor', NULL, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// (4, 'Assistant Teacher', NULL, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// (5, 'Post-graduate Teacher', NULL, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// (6, 'Non-teaching Staff', NULL, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// (7, 'Librarian', NULL, NULL, 6, 1, '2026-02-17 13:48:39', '2026-02-17 13:48:39'),
// (8, 'Assistant Librarian', NULL, NULL, 6, 1, '2026-02-17 13:48:39', '2026-02-17 13:48:39'),
// (9, 'Senior Assistant', NULL, NULL, 6, 1, '2026-02-17 13:48:39', '2026-02-17 13:48:39'),
// (10, 'Junior Assistant', NULL, NULL, 6, 1, '2026-02-17 13:48:39', '2026-02-17 13:48:39'),
// (11, 'Laboratory Assistant for Science Stream', NULL, NULL, 6, 1, '2026-02-17 13:48:39', '2026-02-17 13:48:39'),
// (12, 'Library Assistant', NULL, NULL, 6, 1, '2026-02-17 13:48:39', '2026-02-17 13:48:39'),
// (13, 'Laboratory Bearer for Science Stream', NULL, NULL, 6, 1, '2026-02-17 13:48:39', '2026-02-17 13:48:39'),
// (14, 'Grade-IV', NULL, NULL, 6, 1, '2026-02-17 13:48:39', '2026-02-17 13:48:39');

// INSERT INTO `designations` (`name`, `employment_type_id`, `category_type_id`, `parent_id`, `is_active`, `created_at`, `updated_at`) VALUES
// ('Demonstrator', 1, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// ('Subject Teacher', 1, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// ('Assistant Head Master/Assistant Superintendent', 1, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// ('Graduate Teacher', 1, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// ('Sr. Hindi Teacher', 1, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// ('Music Teacher/Classical Teacher', 1, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// ('Craft Teacher', 1, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// ('Head Master', 1, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
// ('Hindi Teacher/Arabic Teacher/Language Teacher', 1, NULL, NULL, 1, '2026-02-17 13:45:11', '2026-02-17 13:45:11'),
