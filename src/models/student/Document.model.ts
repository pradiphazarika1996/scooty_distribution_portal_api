import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";
import Application from "./Application.model";
import Student from "./Student.model";

const Document = sequelize.define(
  "Document",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    application_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    doc_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment:
        "1: govt_id, 2: marksheet, 3: age_proof, 4: address_proof, 5: school_pass_certificate, 6: bank_pass_book, 7: caste_certificate, 8: passport_photo",
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_type: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    file_size: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "student_documents",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["student_id"] },
      { fields: ["application_id"] },
      { fields: ["application_id", "doc_type"] },
    ],
  },
);

Student.hasMany(Document, {
  foreignKey: "student_id",
  as: "documents",
});
Document.belongsTo(Student, {
  foreignKey: "student_id",
  as: "student",
});

Application.hasMany(Document, {
  foreignKey: "application_id",
  as: "documents",
});
Document.belongsTo(Application, {
  foreignKey: "application_id",
  as: "application",
});

export default Document;
