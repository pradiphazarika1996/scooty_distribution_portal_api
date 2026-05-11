import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";
import InstitutionCategory from "./InstitutionCategory.model";

const Course = sequelize.define(
  "course",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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

Course.belongsTo(InstitutionCategory, {
  foreignKey: "category_id",
  as: "category",
});
InstitutionCategory.hasMany(Course, {
  foreignKey: "category_id",
  as: "courses",
});

export default Course;

// INSERT INTO `courses` (`id`, `category_id`, `name`, `is_active`, `created_at`, `updated_at`) VALUES
// (1, NULL, 'Class VIII', 1, '2026-02-17 14:36:04', '2026-02-17 14:36:04'),
// (2, NULL, 'Class X', 1, '2026-02-17 14:36:11', '2026-02-17 14:36:11'),
// (3, NULL, 'Higher Secondary School', 1, '2026-02-17 14:36:27', '2026-02-17 14:36:27'),
// (4, NULL, 'Graduate', 1, '2026-02-17 14:36:32', '2026-02-17 14:36:32'),
// (5, NULL, 'Post Graduate', 1, '2026-02-17 14:36:38', '2026-02-17 14:36:38');
