import { Op, Sequelize, type WhereOptions } from "sequelize";
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_LABELS,
  MARKING_SYSTEM,
  getStateName,
} from "../../helpers/students/application";
import {
  getBoardName,
  getCasteName,
  getExamTypeName,
  getGenderName,
} from "../../helpers/students/student";
import District from "../../models/masters/District.model";
import Application from "../../models/student/Application.model";
import Student from "../../models/student/Student.model";

// ── Types ────────────────────────────────────────────────────

export interface GetApplicationsParams {
  search?: string;
  remarksSearch?: string;
  applicantType?: string;
  district?: string;
  exam?: string;
  gender?: string;
  lastAction?: string;
  activeTab?: string;
  page?: number;
  limit?: number;
}

type DecisionResult =
  | { ok: true; id: number; status: number }
  | { ok: false; reason: "NOT_FOUND" }
  | { ok: false; reason: "INVALID_STATUS"; currentStatus: number };

// ── Helpers ──────────────────────────────────────────────────

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

const EXAM_ID_MAP: Record<string, number> = {
  hslc: 1,
  hs: 2,
};

const STATUS_BUCKET_MAP: Record<number, string> = {
  [APPLICATION_STATUS.DRAFT]: "pending",
  [APPLICATION_STATUS.SUBMITTED]: "submitted",
  [APPLICATION_STATUS.PAYMENT_COMPLETED]: "submitted",
  [APPLICATION_STATUS.UNDER_REVIEW]: "under_scrutiny",
  [APPLICATION_STATUS.QUERY_RAISED]: "under_scrutiny",
  [APPLICATION_STATUS.APPROVED]: "approved",
  [APPLICATION_STATUS.REJECTED]: "rejected",
};

async function resolveDistrictNames(
  districtIds: number[],
): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  if (districtIds.length === 0) return map;

  const districts = (await District.findAll({
    where: { id: { [Op.in]: districtIds } },
    attributes: ["id", "name"],
    raw: true,
  })) as unknown as { id: number; name: string }[];

  districts.forEach((d) => map.set(d.id, d.name));
  return map;
}

// ── WHERE condition builders ──────────────────────────────────

// FIX: Search was previously split across two builders — application
// conditions added `application_number LIKE` and student conditions
// added `name/phone/email LIKE`. Because student conditions apply to
// the JOIN's own where clause, Sequelize combined them with AND logic,
// requiring BOTH to match simultaneously. Fixed by collapsing all four
// search fields into a single Op.or in the APPLICATION conditions,
// using Sequelize.col to reference the joined student columns. This
// correctly returns rows where ANY of the four fields matches.

function buildApplicationWhereConditions(
  params: GetApplicationsParams,
): WhereOptions[] {
  const appConditions: WhereOptions[] = [];

  // ── Exam filter ──────────────────────────────────────────
  if (params.exam && params.exam !== "all" && EXAM_ID_MAP[params.exam]) {
    appConditions.push({ exam_id: EXAM_ID_MAP[params.exam] });
  }

  // ── Status filter ────────────────────────────────────────
  if (params.activeTab === "approved") {
    appConditions.push({ application_status: APPLICATION_STATUS.APPROVED });
  } else if (params.activeTab === "rejected") {
    appConditions.push({ application_status: APPLICATION_STATUS.REJECTED });
  }

  // ── Global search — single OR across all 4 fields ────────
  // All four fields are in one Op.or so a match on ANY field
  // returns the row. The student columns are referenced via
  // Sequelize.col("student.name") etc., which works because the
  // student model is always included with required: true (INNER JOIN),
  // making those columns available in the WHERE clause.
  if (params.search && params.search.trim()) {
    const q = `%${escapeLike(params.search.trim())}%`;
    appConditions.push({
      [Op.or]: [
        { application_number: { [Op.like]: q } },
        Sequelize.where(Sequelize.col("student.name"), { [Op.like]: q }),
        Sequelize.where(Sequelize.col("student.phone"), { [Op.like]: q }),
        Sequelize.where(Sequelize.col("student.email"), { [Op.like]: q }),
      ],
    } as WhereOptions);
  }

  // ── Remarks search ────────────────────────────────────────
  if (params.remarksSearch && params.remarksSearch.trim()) {
    const q = `%${escapeLike(params.remarksSearch.trim())}%`;
    appConditions.push({
      [Op.or]: [
        { review_remarks: { [Op.like]: q } },
        { approval_remarks: { [Op.like]: q } },
        { rejection_reason: { [Op.like]: q } },
      ],
    } as WhereOptions);
  }

  // ── Last action date range ───────────────────────────────
  if (params.lastAction && params.lastAction !== "all") {
    const now = new Date();
    let from: Date | null = null;

    if (params.lastAction === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (params.lastAction === "week") {
      from = new Date(now);
      from.setDate(now.getDate() - 7);
    } else if (params.lastAction === "month") {
      from = new Date(now);
      from.setMonth(now.getMonth() - 1);
    }

    if (from) {
      appConditions.push({ status_updated_at: { [Op.gte]: from } });
    }
  }

  return appConditions;
}

// Student-table conditions — only non-search filters remain here.
// Search was removed from this builder (see fix note above).
function buildStudentWhereConditions(
  params: GetApplicationsParams,
): WhereOptions[] {
  const studentConditions: WhereOptions[] = [];

  if (params.gender && params.gender !== "all") {
    studentConditions.push({ gender_id: Number(params.gender) });
  }

  if (params.applicantType === "within_mac") {
    studentConditions.push({ is_resident_of_mac_area: true });
  } else if (params.applicantType === "outside_mac") {
    studentConditions.push({ is_resident_of_mac_area: false });
  }

  if (params.district && params.district !== "all") {
    studentConditions.push({ district_id: Number(params.district) });
  }

  return studentConditions;
}

// ── getApplications — table list ────────────────────────────

export const getApplications = async (params: GetApplicationsParams) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 15;
  const offset = (page - 1) * limit;

  const appConditions = buildApplicationWhereConditions(params);
  const studentConditions = buildStudentWhereConditions(params);

  const { rows, count } = await Application.findAndCountAll({
    where: appConditions.length ? { [Op.and]: appConditions } : undefined,
    include: [
      {
        model: Student,
        as: "student",
        attributes: [
          "id",
          "name",
          "phone",
          "email",
          "district_id",
          "is_resident_of_mac_area",
        ],
        where: studentConditions.length
          ? { [Op.and]: studentConditions }
          : undefined,
        required: true,
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
    subQuery: false,
  });

  const districtIds = [
    ...new Set(
      rows
        .map((r: any) => r.student?.district_id)
        .filter((id: number | undefined): id is number => !!id),
    ),
  ];
  const districtMap = await resolveDistrictNames(districtIds);

  const applications = rows.map((row: any) => {
    const app = row.toJSON();
    return {
      id: app.id,
      referenceNo: app.application_number ?? `APP-${app.id}`,
      applicant: {
        name: app.student?.name ?? null,
        phone: app.student?.phone ?? null,
        initials: ((app.student?.name ?? "") as string)
          .split(" ")
          .filter(Boolean)
          .map((w: string) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
      },
      exam: {
        type: getExamTypeName(app.exam_id),
        board: null,
        year: app.year_of_passing,
      },
      percentage:
        app.percentage_of_marks != null
          ? Number(app.percentage_of_marks)
          : null,
      location: {
        district: app.student?.district_id
          ? (districtMap.get(app.student.district_id) ?? null)
          : null,
        subLocation: null,
      },
      appliedDate: app.submitted_at,
      status: STATUS_BUCKET_MAP[app.application_status] ?? "pending",
    };
  });

  return { applications, total: count, page, limit };
};

// ── getApplicationsForExport — async generator, batched ─────

export async function* getApplicationsForExport(
  params: GetApplicationsParams,
): AsyncGenerator<any[], void, unknown> {
  const BATCH_SIZE = 500;
  let offset = 0;

  const appConditions = buildApplicationWhereConditions(params);
  const studentConditions = buildStudentWhereConditions(params);

  while (true) {
    const rows = await Application.findAll({
      where: appConditions.length ? { [Op.and]: appConditions } : undefined,
      include: [
        {
          model: Student,
          as: "student",
          attributes: ["name", "phone", "email", "district_id"],
          where: studentConditions.length
            ? { [Op.and]: studentConditions }
            : undefined,
          required: true,
        },
      ],
      limit: BATCH_SIZE,
      offset,
      order: [["created_at", "DESC"]],
      subQuery: false,
    });

    if (rows.length === 0) break;

    const districtIds = [
      ...new Set(
        rows
          .map((r: any) => r.student?.district_id)
          .filter((id: number | undefined): id is number => !!id),
      ),
    ];
    const districtMap = await resolveDistrictNames(districtIds);

    yield rows.map((row: any) => {
      const app = row.toJSON();
      return {
        referenceNo: app.application_number ?? `APP-${app.id}`,
        applicant: {
          name: app.student?.name ?? null,
          phone: app.student?.phone ?? null,
        },
        exam: {
          type: getExamTypeName(app.exam_id),
          board: null,
          year: app.year_of_passing,
        },
        percentage: app.percentage_of_marks,
        location: {
          district: app.student?.district_id
            ? (districtMap.get(app.student.district_id) ?? null)
            : null,
          subLocation: null,
        },
        appliedDate: app.submitted_at,
        status: STATUS_BUCKET_MAP[app.application_status] ?? "pending",
        // Bank details — columns already fetched (no attributes
        // restriction on Application.findAll), mapped here so
        // exportServices.ts toRow() can read them.
        bankName: app.bank_name ?? null,
        branchName: app.branch_name ?? null,
        accountNo: app.account_no ?? null,
        ifscCode: app.ifsc_code ?? null,
      };
    });

    offset += BATCH_SIZE;
    if (rows.length < BATCH_SIZE) break;
  }
}

// ── getFilterOptions ─────────────────────────────────────────

export const getFilterOptions = async () => {
  const districts = await District.findAll({
    attributes: ["id", "name"],
    order: [["name", "ASC"]],
    raw: true,
  });

  return { districts };
};

// ── getApplicationById — View Details page ──────────────────

export const getApplicationById = async (id: number) => {
  const row = await Application.findOne({
    where: { id },
    include: [
      {
        model: Student,
        as: "student",
        attributes: [
          "name",
          "phone",
          "email",
          "guardian_name",
          "gender_id",
          "date_of_birth",
          "caste_id",
          "other_caste_name",
          "aadhaar_number",
          "is_resident_of_mac_area",
          "district_id",
          "constituency_id",
          "village_id",
          "other_village_name",
          "panchayat_name",
          "municipal_area",
          "state_id",
          "city",
          "permanent_address",
          "present_address",
          "pin_code",
        ],
        required: false,
      },
    ],
    attributes: [
      "id",
      "application_number",
      "exam_id",
      "academic_year",
      "year_of_passing",
      "board_id",
      "other_board_name",
      "roll_no",
      "marking_system",
      "percentage_of_marks",
      "cgpa",
      "institution_name",
      "institution_address",
      "bank_name",
      "branch_name",
      "account_no",
      "ifsc_code",
      "application_status",
      "submitted_at",
      "status_updated_at",
      "payment_status",
      "payment_amount",
      "payment_date",
      "payment_mode",
      "under_review_at",
      "review_remarks",
      "approved_at",
      "approval_remarks",
      "approval_order_number",
      "rejected_at",
      "rejection_reason",
    ],
  });

  if (!row) return null;

  const app = row.toJSON() as Record<string, any>;
  const s = app.student ?? {};

  let districtName: string | null = null;
  if (s.district_id) {
    const district = (await District.findOne({
      where: { id: s.district_id },
      attributes: ["name"],
      raw: true,
    })) as unknown as { name: string } | null;
    districtName = district?.name ?? null;
  }

  const marksDisplay =
    app.marking_system === MARKING_SYSTEM.CGPA
      ? app.cgpa != null
        ? `${Number(app.cgpa)} CGPA`
        : null
      : app.percentage_of_marks != null
        ? `${Number(app.percentage_of_marks).toFixed(2)}%`
        : null;

  return {
    id: app.id as number,
    referenceNo: app.application_number ?? `APP-${app.id}`,
    examType: getExamTypeName(app.exam_id),
    academicYear: app.academic_year as string,
    applicationStatus: app.application_status as number,
    applicationStatusLabel:
      (APPLICATION_STATUS_LABELS as Record<number, string>)[
        app.application_status
      ] ?? "Draft",
    submittedAt: app.submitted_at
      ? new Date(app.submitted_at).toISOString()
      : null,
    statusUpdatedAt: app.status_updated_at
      ? new Date(app.status_updated_at).toISOString()
      : null,

    boardName: app.board_id
      ? (app.other_board_name ?? getBoardName(app.board_id))
      : null,
    rollNo: app.roll_no as string | null,
    yearOfPassing: app.year_of_passing as string | null,
    marksDisplay,
    institutionName: app.institution_name as string | null,
    institutionAddress: app.institution_address as string | null,

    bankName: app.bank_name as string | null,
    branchName: app.branch_name as string | null,
    accountNo: app.account_no as string | null,
    ifscCode: app.ifsc_code as string | null,

    paymentStatus: app.payment_status as number | null,
    paymentAmount:
      app.payment_amount != null ? Number(app.payment_amount) : null,
    paymentDate: app.payment_date
      ? new Date(app.payment_date).toISOString()
      : null,
    paymentMode: app.payment_mode as string | null,

    underReviewAt: app.under_review_at
      ? new Date(app.under_review_at).toISOString()
      : null,
    reviewRemarks: app.review_remarks as string | null,
    approvedAt: app.approved_at
      ? new Date(app.approved_at).toISOString()
      : null,
    approvalRemarks: app.approval_remarks as string | null,
    approvalOrderNumber: app.approval_order_number as string | null,
    rejectedAt: app.rejected_at
      ? new Date(app.rejected_at).toISOString()
      : null,
    rejectionReason: app.rejection_reason as string | null,

    studentName: (s.name ?? null) as string | null,
    phone: (s.phone ?? null) as string | null,
    email: (s.email ?? null) as string | null,
    guardianName: (s.guardian_name ?? null) as string | null,
    genderName: s.gender_id ? getGenderName(s.gender_id) : null,
    dateOfBirth: (s.date_of_birth ?? null) as string | null,
    casteName: s.caste_id
      ? (s.other_caste_name ?? getCasteName(s.caste_id))
      : null,
    aadhaarNumber: (s.aadhaar_number ?? null) as string | null,

    isResidentOfMacArea: s.is_resident_of_mac_area !== false,
    districtName,
    panchayatName: (s.panchayat_name ?? null) as string | null,
    municipalArea: (s.municipal_area ?? null) as string | null,
    otherVillageName: (s.other_village_name ?? null) as string | null,
    stateName: s.state_id ? getStateName(s.state_id) : null,
    city: (s.city ?? null) as string | null,
    permanentAddress: (s.permanent_address ?? null) as string | null,
    presentAddress: (s.present_address ?? null) as string | null,
    pinCode: (s.pin_code ?? null) as string | null,
  };
};

// ── approveApplication / rejectApplication ───────────────────

export const approveApplication = async (
  id: number,
  remarks: string | undefined,
  actorId: number | undefined,
): Promise<DecisionResult> => {
  const app = await Application.findByPk(id);
  if (!app) return { ok: false, reason: "NOT_FOUND" };

  const currentStatus = Number(app.get("application_status"));
  const DECIDABLE: number[] = [
    APPLICATION_STATUS.SUBMITTED,
    APPLICATION_STATUS.APPROVED,
    APPLICATION_STATUS.REJECTED,
  ];
  if (
    !DECIDABLE.includes(currentStatus) ||
    currentStatus === APPLICATION_STATUS.APPROVED
  ) {
    return { ok: false, reason: "INVALID_STATUS", currentStatus };
  }

  await app.update({
    application_status: APPLICATION_STATUS.APPROVED,
    approved_at: new Date(),
    approved_by: actorId ?? null,
    approval_remarks: remarks ?? null,
    status_updated_at: new Date(),
  });

  return {
    ok: true,
    id: app.get("id") as number,
    status: APPLICATION_STATUS.APPROVED,
  };
};

export const rejectApplication = async (
  id: number,
  remarks: string | undefined,
  actorId: number | undefined,
): Promise<DecisionResult> => {
  const app = await Application.findByPk(id);
  if (!app) return { ok: false, reason: "NOT_FOUND" };

  const currentStatus = Number(app.get("application_status"));
  const DECIDABLE: number[] = [
    APPLICATION_STATUS.SUBMITTED,
    APPLICATION_STATUS.APPROVED,
    APPLICATION_STATUS.REJECTED,
  ];
  if (
    !DECIDABLE.includes(currentStatus) ||
    currentStatus === APPLICATION_STATUS.REJECTED
  ) {
    return { ok: false, reason: "INVALID_STATUS", currentStatus };
  }

  await app.update({
    application_status: APPLICATION_STATUS.REJECTED,
    rejected_at: new Date(),
    rejected_by: actorId ?? null,
    rejection_reason: remarks ?? null,
    status_updated_at: new Date(),
  });

  return {
    ok: true,
    id: app.get("id") as number,
    status: APPLICATION_STATUS.REJECTED,
  };
};
