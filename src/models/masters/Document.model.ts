import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";

const Document = sequelize.define(
  "document",
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
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_type: {
      type: DataTypes.SMALLINT,
    },
    is_mandatory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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

export default Document;

// INSERT INTO `documents` (`id`, `name`, `code`, `file_type`, `is_mandatory`, `is_active`, `created_at`, `updated_at`) VALUES
// (1, 'Permission', '1', 2, 1, 1, '2026-02-09 13:07:12', '2026-02-09 13:07:12'),
// (2, 'Affiliation', '2', 2, 1, 1, '2026-02-09 13:07:29', '2026-02-09 13:07:29'),
// (3, 'Land', '3', 2, 1, 1, '2026-02-09 13:07:39', '2026-02-09 13:07:39'),
// (4, 'Result', '4', 2, 1, 1, '2026-02-09 13:07:59', '2026-02-09 13:07:59');
