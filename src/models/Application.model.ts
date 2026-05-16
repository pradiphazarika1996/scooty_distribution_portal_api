// import { DataTypes } from "sequelize";
// import sequelize from "../config/sequelize";
// // import { PAYMENT_STATUS } from "../helpers/application";
// import Institution from "./Institution/Institution.model";

// export const PAYMENT_STATUS = Object.freeze({
//   PENDING: 1,
//   COMPLETED: 2,
//   FAILED: 3,
//   REFUNDED: 4,
// });

// const Application = sequelize.define(
//   "application",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     application_number: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       comment: "Human-readable application number (e.g., PMS/AS/2025/00001)",
//     },
//     institution_id: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     application_status: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       comment:
//         "1=Submitted, 3=Payment Pending, 4=Under Review, 5=Approved, 6=Rejected",
//     },
//     submitted_at: {
//       type: DataTypes.DATE,
//       comment: "When application was submitted (moved from draft to submitted)",
//     },
//     status_updated_at: {
//       type: DataTypes.DATE,
//       comment: "Last time the application status was updated",
//     },

//     // Payment details
//     payment_status: {
//       type: DataTypes.INTEGER,
//       defaultValue: PAYMENT_STATUS.PENDING,
//       comment: "1=Pending, 2=Completed, 3=Failed, 4=Refunded",
//     },
//     payment_amount: {
//       type: DataTypes.DECIMAL(10, 2),
//       comment: "Application fee amount",
//     },
//     payment_reference: {
//       type: DataTypes.STRING(100),
//       comment: "Payment gateway transaction ID",
//     },
//     payment_date: {
//       type: DataTypes.DATE,
//     },
//     payment_mode: {
//       type: DataTypes.STRING,
//       comment: "Online/Challan/DD",
//     },

//     // Review & approval
//     under_review_at: {
//       type: DataTypes.DATE,
//     },
//     review_remarks: {
//       type: DataTypes.TEXT,
//     },

//     // Final decision
//     approved_at: {
//       type: DataTypes.DATE,
//     },
//     approved_by: {
//       type: DataTypes.INTEGER,
//     },
//     approval_remarks: {
//       type: DataTypes.TEXT,
//     },
//     approval_order_number: {
//       type: DataTypes.STRING,
//       comment: "Government order number",
//     },

//     rejected_at: {
//       type: DataTypes.DATE,
//     },
//     rejected_by: {
//       type: DataTypes.INTEGER,
//     },
//     rejection_reason: {
//       type: DataTypes.TEXT,
//     },

//     // Additional metadata
//     is_locked: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//       comment: "Lock application after submission",
//     },

//     // Snapshot of institution data at submission (optional JSON)
//     submission_snapshot: {
//       type: DataTypes.JSON,
//       comment: "Snapshot of institution data at submission time",
//     },
//   },
//   {
//     timestamps: true,
//     underscored: true,
//     indexes: [
//       { fields: ["institution_id"] },
//       { fields: ["application_number"] },
//       { fields: ["application_status"] },
//       { fields: ["payment_status"] },
//       { fields: ["created_at"] },
//     ],
//   },
// );

// // Associations
// Application.belongsTo(Institution, {
//   foreignKey: "institution_id",
//   as: "institution",
// });

// Institution.hasMany(Application, {
//   foreignKey: "institution_id",
//   as: "applications",
// });

// export default Application;
