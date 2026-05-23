import { DataTypes } from "sequelize";
import sequelize from "../../config/sequelize";
import Student from "./Student.model";

export const APPLICATION_STATUS = Object.freeze({
  DRAFT: 1,
  SUBMITTED: 2,
  PAYMENT_COMPLETED: 3,
  UNDER_REVIEW: 4,
  QUERY_RAISED: 5,
  APPROVED: 6,
  REJECTED: 7,
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 1,
  COMPLETED: 2,
  FAILED: 3,
});

export const MARKING_SYSTEM = Object.freeze({
  PERCENTAGE: 1,
  CGPA: 2,
});

const Application = sequelize.define(
  "Application",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    application_number: {
      type: DataTypes.STRING,
      comment:
        "Human-readable number, generated at submission (e.g., SCH/2025/00001)",
    },
    student_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    exam_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "1=HSLC, 2=HS — set when draft is created",
    },
    academic_year: {
      type: DataTypes.STRING(9),
      allowNull: false,
      comment: "e.g. 2025-2026 — ties application to a cycle",
    },

    // ── Academic Details (per-application) ──
    year_of_passing: {
      type: DataTypes.STRING(4),
    },
    board_id: {
      type: DataTypes.INTEGER,
    },
    other_board_name: {
      type: DataTypes.STRING,
    },
    roll_no: {
      type: DataTypes.STRING,
    },
    marking_system: {
      type: DataTypes.INTEGER,
      defaultValue: MARKING_SYSTEM.PERCENTAGE,
      comment: "1=Percentage, 2=CGPA",
    },
    percentage_of_marks: {
      type: DataTypes.DECIMAL(5, 2),
    },
    cgpa: {
      type: DataTypes.DECIMAL(4, 2),
    },
    institution_name: {
      type: DataTypes.STRING,
    },
    institution_address: {
      type: DataTypes.TEXT,
    },

    // ── Bank Details (per-application, may differ) ──
    bank_name: {
      type: DataTypes.STRING,
    },
    branch_name: {
      type: DataTypes.STRING,
    },
    account_no: {
      type: DataTypes.STRING(18),
      comment: "9-18 digits depending on bank",
    },
    ifsc_code: {
      type: DataTypes.STRING(11),
    },

    // ── Form Progress ──
    completed_step: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: "Highest completed step number",
    },

    // ── Application Status ──
    application_status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: APPLICATION_STATUS.DRAFT,
      comment:
        "1=Draft, 2=Submitted, 3=Payment Pending, 4=Under Review, 5=Approved, 6=Rejected",
    },
    submitted_at: {
      type: DataTypes.DATE,
    },
    status_updated_at: {
      type: DataTypes.DATE,
    },

    // ── Payment ──
    payment_status: {
      type: DataTypes.INTEGER,
      defaultValue: PAYMENT_STATUS.PENDING,
      comment: "1=Pending, 2=Completed, 3=Failed",
    },
    payment_amount: {
      type: DataTypes.DECIMAL(10, 2),
    },
    payment_reference: {
      type: DataTypes.STRING(100),
    },
    payment_date: {
      type: DataTypes.DATE,
    },
    payment_mode: {
      type: DataTypes.STRING,
    },

    // ── Review & Approval ──
    under_review_at: {
      type: DataTypes.DATE,
    },
    review_remarks: {
      type: DataTypes.TEXT,
    },
    approved_at: {
      type: DataTypes.DATE,
    },
    approved_by: {
      type: DataTypes.INTEGER,
    },
    approval_remarks: {
      type: DataTypes.TEXT,
    },
    approval_order_number: {
      type: DataTypes.STRING,
    },
    rejected_at: {
      type: DataTypes.DATE,
    },
    rejected_by: {
      type: DataTypes.INTEGER,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
    },

    // ── Metadata ──
    is_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    submission_snapshot: {
      type: DataTypes.JSON,
      comment: "Snapshot of student profile at submission time",
    },
  },
  {
    tableName: "student_applications",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["student_id"] },
      { fields: ["application_number"] },
      { fields: ["application_status"] },
      { fields: ["student_id", "exam_id"], unique: true },
      { fields: ["student_id", "academic_year"] },
      { fields: ["created_at"] },
    ],
  },
);

Student.hasMany(Application, {
  foreignKey: "student_id",
  as: "applications",
});
Application.belongsTo(Student, {
  foreignKey: "student_id",
  as: "student",
});

export default Application;
