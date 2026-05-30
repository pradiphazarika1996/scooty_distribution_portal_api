import { Op, Sequelize } from "sequelize";
import { EXAM_TYPE } from "../../helpers/students/student";
import District from "../../models/masters/District.model";
import Application, {
  APPLICATION_STATUS,
  MARKING_SYSTEM,
} from "../../models/student/Application.model";
import Student from "../../models/student/Student.model";
// Statuses that represent "in-progress" / awaiting admin action
const PENDING_STATUSES = [
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.PAYMENT_COMPLETED,
  APPLICATION_STATUS.UNDER_REVIEW,
  APPLICATION_STATUS.QUERY_RAISED,
];

const ACTIVE_FILTER = {
  application_status: { [Op.ne]: APPLICATION_STATUS.DRAFT },
};

export const getStatCardData = async () => {
  const [total, approved, rejected, pending] = await Promise.all([
    Application.count(),
    Application.count({
      where: { application_status: APPLICATION_STATUS.APPROVED },
    }),
    Application.count({
      where: { application_status: APPLICATION_STATUS.REJECTED },
    }),
    Application.count({
      where: { application_status: { [Op.in]: PENDING_STATUSES } },
    }),
  ]);

  const approvedPercentage =
    total > 0 ? Math.round((approved / total) * 100) : 0;

  return { total, approved, rejected, pending, approvedPercentage };
};

export const getRecentApplications = async (limit = 5) => {
  const rows = await Application.findAll({
    where: {
      application_status: { [Op.ne]: APPLICATION_STATUS.DRAFT },
      submitted_at: { [Op.ne]: null },
    },
    include: [
      {
        model: Student,
        as: "student",
        attributes: ["name"],
      },
    ],
    order: [["submitted_at", "DESC"]],
    limit,
    attributes: [
      "id",
      "application_number",
      "exam_id",
      "marking_system",
      "percentage_of_marks",
      "cgpa",
      "application_status",
      "submitted_at",
    ],
  });

  return rows.map((row) => {
    // toJSON() is the correct way to get a plain object that includes
    // association data. get({ plain: true }) can lose nested models.
    const app = row.toJSON() as Record<string, any>;

    const marksDisplay =
      app.marking_system === MARKING_SYSTEM.CGPA
        ? `${app.cgpa ?? "-"} CGPA`
        : `${app.percentage_of_marks ?? "-"}%`;

    // submitted_at is a Date instance on the Sequelize model —
    // convert explicitly so the API always sends an ISO string.
    const submittedAt: string | null = app.submitted_at
      ? new Date(app.submitted_at).toISOString()
      : null;

    return {
      id: app.id as number,
      applicationNumber: (app.application_number ?? "") as string,
      studentName: (app.student?.name ?? "Unknown") as string,
      examId: app.exam_id as number,
      submittedAt,
      marksDisplay,
      applicationStatus: app.application_status as number,
    };
  });
};

// dashboardService.ts — replace getExamSplitData

export const getExamSplitData = async () => {
  // Count ALL applications per exam type regardless of status
  const [hslc, hs] = await Promise.all([
    Application.count({ where: { exam_id: EXAM_TYPE.HSLC } }),
    Application.count({ where: { exam_id: EXAM_TYPE.HS } }),
  ]);

  return { hslc, hs };
};
// export const getExamSplitData = async () => {
//   // Exclude drafts — only count applications that have been actively submitted
//   const activeFilter = {
//     application_status: { [Op.ne]: APPLICATION_STATUS.APPROVED },
//   };

//   const [hslc, hs] = await Promise.all([
//     Application.count({ where: { ...activeFilter, exam_id: EXAM_TYPE.HSLC } }),
//     Application.count({ where: { ...activeFilter, exam_id: EXAM_TYPE.HS } }),
//   ]);

//   return { hslc, hs };
// };
// export const getDistrictChartData = async () => {
//   const results = (await Student.findAll({
//     attributes: [
//       "district_id",
//       // ✅ alias matches what we read below: r.appCount
//       [Sequelize.fn("COUNT", Sequelize.col("applications.id")), "appCount"],
//     ],
//     include: [
//       {
//         model: Application,
//         as: "applications",
//         attributes: [],
//         required: true, // INNER JOIN — students must have at least one application
//         // ✅ No where filter — drafts included so test data shows up
//       },
//     ],
//     where: {
//       district_id: { [Op.ne]: null }, // student must have a district selected
//     },
//     group: ["Student.district_id"],
//     raw: true,
//   })) as unknown as Array<{ district_id: string; appCount: string }>;

//   if (!results.length) return [];

//   // MySQL raw queries return numeric columns as strings — cast both sides
//   const districtIds = results
//     .map((r) => Number(r.district_id))
//     .filter((id) => id > 0);

//   const districts = (await District.findAll({
//     where: { id: districtIds },
//     attributes: ["id", "name"],
//     raw: true,
//   })) as unknown as Array<{ id: number; name: string }>;

//   const districtMap = new Map(districts.map((d) => [Number(d.id), d.name]));

//   return results
//     .map((r) => ({
//       district: districtMap.get(Number(r.district_id)) ?? "",
//       count: Number(r.appCount),
//     }))
//     .filter((r) => r.district !== "")
//     .sort((a, b) => b.count - a.count);
// };

export const getDistrictChartData = async () => {
  const results = (await Student.findAll({
    attributes: [
      "district_id",
      // ✅ alias matches what we read below: r.appCount
      [Sequelize.fn("COUNT", Sequelize.col("applications.id")), "appCount"],
    ],
    include: [
      {
        model: Application,
        as: "applications",
        attributes: [],
        required: true, // INNER JOIN — students must have at least one application
        // ✅ No where filter — drafts included so test data shows up
      },
    ],
    where: {
      district_id: { [Op.ne]: null }, // student must have a district selected
    },
    group: ["Student.district_id"],
    raw: true,
  })) as unknown as Array<{ district_id: string; appCount: string }>;

  if (!results.length) return [];

  // MySQL raw queries return numeric columns as strings — cast both sides
  const districtIds = results
    .map((r) => Number(r.district_id))
    .filter((id) => id > 0);

  const districts = (await District.findAll({
    where: { id: districtIds },
    attributes: ["id", "name"],
    raw: true,
  })) as unknown as Array<{ id: number; name: string }>;

  const districtMap = new Map(districts.map((d) => [Number(d.id), d.name]));

  return results
    .map((r) => ({
      district: districtMap.get(Number(r.district_id)) ?? "",
      count: Number(r.appCount),
    }))
    .filter((r) => r.district !== "")
    .sort((a, b) => b.count - a.count);
};
