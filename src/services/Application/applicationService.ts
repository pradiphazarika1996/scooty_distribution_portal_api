import { Op, Sequelize, WhereOptions } from "sequelize";
import District from "../../models/masters/District.model";
import Application from "../../models/student/Application.model";
import Student from "../../models/student/Student.model";
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

const EXAM_LABEL: Record<number, string> = {
  1: "HSLC",
  2: "HS",
};

const BOARD_LABEL: Record<number, string> = {
  1: "SEBA",
  2: "CBSE",
  3: "ICSE",
  4: "Other",
};

const STATUS_MAP: Record<number, string> = {
  [APPLICATION_STATUS.DRAFT]: "pending",
  [APPLICATION_STATUS.SUBMITTED]: "submitted",
  [APPLICATION_STATUS.PAYMENT_COMPLETED]: "pending",

  [APPLICATION_STATUS.UNDER_REVIEW]: "under_scrutiny",
  [APPLICATION_STATUS.QUERY_RAISED]: "under_scrutiny",

  [APPLICATION_STATUS.APPROVED]: "approved",
  [APPLICATION_STATUS.REJECTED]: "rejected",
};

const TAB_STATUSES: Record<string, number[]> = {
  pending: [
    APPLICATION_STATUS.DRAFT,
    APPLICATION_STATUS.SUBMITTED,
    APPLICATION_STATUS.PAYMENT_COMPLETED,
  ],

  under_scrutiny: [
    APPLICATION_STATUS.UNDER_REVIEW,
    APPLICATION_STATUS.QUERY_RAISED,
  ],

  approved: [APPLICATION_STATUS.APPROVED],

  rejected: [APPLICATION_STATUS.REJECTED],
};


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


function getInitials(name: string): string {
  return (name ?? "")
    .split(" ")
    .filter(Boolean)
    .map((word: string) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

function buildLastActionDate(value: string): Date | null {
  const now = new Date();

  if (value === "today") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }

  if (value === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }

  if (value === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }

  return null;
}

function formatDate(dateValue: any): string {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  // Invalid Date check
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toISOString().split("T")[0];
}

// ─────────────────────────────────────────────────────────────
// Query Builder
// ─────────────────────────────────────────────────────────────

function buildQuery(params: GetApplicationsParams) {
  const {
    search = "",
    remarksSearch = "",
    applicantType = "all",
    district = "all",
    exam = "all",
    gender = "all",
    lastAction = "all",
    activeTab = "all",
  } = params;

  // ─────────────────────────────────────────────────────────
  // Application Conditions
  // ─────────────────────────────────────────────────────────

  const appConditions: WhereOptions[] = [];

  // Exam Filter
  if (exam !== "all") {
    appConditions.push({
      exam_id: exam === "hslc" ? 1 : 2,
    });
  }

  // Status Tab Filter
  if (activeTab !== "all" && TAB_STATUSES[activeTab]) {
    appConditions.push({
      application_status: {
        [Op.in]: TAB_STATUSES[activeTab],
      },
    });
  }

  // Last Action Filter
  const lastActionDate = buildLastActionDate(lastAction);

  if (lastActionDate) {
    appConditions.push({
      status_updated_at: {
        [Op.gte]: lastActionDate,
      },
    });
  }

  // Remarks Search
  if (remarksSearch.trim()) {
    const q = `%${escapeLike(remarksSearch.trim())}%`;

    appConditions.push({
      [Op.or]: [
        {
          review_remarks: {
            [Op.like]: q,
          },
        },

        {
          approval_remarks: {
            [Op.like]: q,
          },
        },

        {
          rejection_reason: {
            [Op.like]: q,
          },
        },
      ],
    } as WhereOptions);
  }

  // Global Search
  if (search.trim()) {
    const q = `%${escapeLike(search.trim())}%`;

    appConditions.push({
      [Op.or]: [
        {
          application_number: {
            [Op.like]: q,
          },
        },

        Sequelize.where(Sequelize.col("student.name"), {
          [Op.like]: q,
        }),

        Sequelize.where(Sequelize.col("student.phone"), {
          [Op.like]: q,
        }),
      ],
    } as WhereOptions);
  }

  const appWhere: WhereOptions =
    appConditions.length === 0
      ? {}
      : appConditions.length === 1
        ? appConditions[0]
        : {
            [Op.and]: appConditions,
          };

  // ─────────────────────────────────────────────────────────
  // Student Conditions
  // ─────────────────────────────────────────────────────────

  const studentWhere: Record<string, any> = {};

  if (district !== "all") {
    studentWhere.district_id = Number(district);
  }

  if (gender !== "all") {
    studentWhere.gender_id = Number(gender);
  }

  if (applicantType === "within_mac") {
    studentWhere.is_resident_of_mac_area = true;
  }

  if (applicantType === "outside_mac") {
    studentWhere.is_resident_of_mac_area = false;
  }

  const hasStudentFilter =
    Object.keys(studentWhere).length > 0 || search.trim().length > 0;

  return {
    appWhere,

    studentInclude: {
      model: Student,
      as: "student",

      attributes: [
        "name",
        "phone",
        "is_resident_of_mac_area",
        "district_id",
        "state_id",
        "city",
        "panchayat_name",
        "municipal_area",
        "other_village_name",
      ],

      where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined,

      required: hasStudentFilter,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Resolve District Names
// ─────────────────────────────────────────────────────────────

async function resolveDistrictNames(rows: any[]): Promise<Map<number, string>> {
  const districtIds = [
    ...new Set(
      rows
        .map((row) => row.student?.district_id)
        .filter(Boolean)
        .map(Number),
    ),
  ];

  const districtMap = new Map<number, string>();

  if (!districtIds.length) {
    return districtMap;
  }

  const districts = (await District.findAll({
    where: {
      id: districtIds,
    },

    attributes: ["id", "name"],

    raw: true,
  })) as unknown as Array<{
    id: number;
    name: string;
  }>;

  districts.forEach((district) => {
    districtMap.set(Number(district.id), district.name);
  });

  return districtMap;
}

// ─────────────────────────────────────────────────────────────
// Shape Row
// ─────────────────────────────────────────────────────────────

function shapeRow(app: Record<string, any>, districtMap: Map<number, string>) {
  const student = app.student ?? {};

  const withinMAC = student.is_resident_of_mac_area !== false;

  const percentage =
    app.marking_system === MARKING_SYSTEM.CGPA
      ? Number(app.cgpa ?? 0)
      : Number(app.percentage_of_marks ?? 0);

  return {
    id: String(app.id),

    referenceNo: app.application_number ?? `APP-${app.id}`,

    applicant: {
      name: student.name ?? "—",

      initials: getInitials(student.name ?? ""),

      phone: student.phone ?? "—",
    },

    exam: {
      type: EXAM_LABEL[app.exam_id] ?? "—",

      board: BOARD_LABEL[app.board_id] ?? "—",

      year: Number(app.year_of_passing) || 0,
    },

    percentage,

    location: {
      district: withinMAC
        ? (districtMap.get(Number(student.district_id)) ?? "—")
        : getStateName(Number(student.state_id)),

      subLocation: withinMAC
        ? student.other_village_name ||
          student.panchayat_name ||
          student.municipal_area ||
          ""
        : (student.city ?? ""),

      isOutsideMAC: !withinMAC,
    },

    // ─────────────────────────────────────────────────────
    // SAFE DATE FIX
    // ─────────────────────────────────────────────────────

    appliedDate: formatDate(app.submitted_at || app.created_at),

    status: STATUS_MAP[app.application_status] ?? "pending",
  };
}

// ─────────────────────────────────────────────────────────────
// Get Applications
// ─────────────────────────────────────────────────────────────

export const getApplications = async (params: GetApplicationsParams = {}) => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 15;

  const { appWhere, studentInclude } = buildQuery(params);

  const { rows, count } = await Application.findAndCountAll({
    where: appWhere,

    include: [studentInclude],

    order: [["created_at", "DESC"]],

    limit,

    offset: (page - 1) * limit,

    distinct: true,

    subQuery: false,
  });

  if (!rows.length) {
    return {
      applications: [],
      total: count,
      page,
      limit,
      totalPages: 0,
    };
  }

  const plainRows = rows.map((row) => row.toJSON()) as Record<string, any>[];

  const districtMap = await resolveDistrictNames(plainRows);

  const applications = plainRows.map((app) => shapeRow(app, districtMap));

  return {
    applications,

    total: count,

    page,

    limit,

    totalPages: Math.ceil(count / limit),
  };
};

// ─────────────────────────────────────────────────────────────
// Export Applications
// ─────────────────────────────────────────────────────────────

export async function* getApplicationsForExport(
  params: Omit<GetApplicationsParams, "page" | "limit">,
) {
  const BATCH_SIZE = 500;

  let offset = 0;

  const { appWhere, studentInclude } = buildQuery(params);

  while (true) {
    const rows = await Application.findAll({
      where: appWhere,

      include: [studentInclude],

      order: [["created_at", "DESC"]],

      limit: BATCH_SIZE,

      offset,

      subQuery: false,
    });

    if (!rows.length) {
      break;
    }

    const plainRows = rows.map((row) => row.toJSON()) as Record<string, any>[];

    const districtMap = await resolveDistrictNames(plainRows);

    yield plainRows.map((app) => shapeRow(app, districtMap));

    if (rows.length < BATCH_SIZE) {
      break;
    }

    offset += BATCH_SIZE;
  }
}

// ─────────────────────────────────────────────────────────────
// Get Filter Options
// ─────────────────────────────────────────────────────────────

export const getFilterOptions = async () => {
  const districts = (await District.findAll({
    attributes: ["id", "name"],

    order: [["name", "ASC"]],

    raw: true,
  })) as unknown as Array<{
    id: number;
    name: string;
  }>;

  return {
    districts,
  };
};


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

  // ── Resolve district name (requires DB) ───────────────
  let districtName: string | null = null;
  if (s.district_id) {
    const district = (await District.findOne({
      where: { id: s.district_id },
      attributes: ["name"],
      raw: true,
    })) as unknown as { name: string } | null;
    districtName = district?.name ?? null;
  }

  // ── Resolve all labels server-side ────────────────────
  // Frontend receives display-ready strings — no ID lookups needed there.

  const marksDisplay =
    app.marking_system === MARKING_SYSTEM.CGPA
      ? app.cgpa != null
        ? `${Number(app.cgpa)} CGPA`
        : null
      : app.percentage_of_marks != null
        ? `${Number(app.percentage_of_marks).toFixed(2)}%`
        : null;

  return {
    // ── Application overview ─────────────────────────────
    id: app.id as number,
    referenceNo: app.application_number ?? `APP-${app.id}`,
    examType: getExamTypeName(app.exam_id), // resolved ✅
    academicYear: app.academic_year as string,
    applicationStatus: app.application_status as number, // kept for UI color logic
    // resolved ✅
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

    // ── Academic details ─────────────────────────────────
    boardName: app.board_id // resolved ✅
      ? (app.other_board_name ?? getBoardName(app.board_id))
      : null,
    rollNo: app.roll_no as string | null,
    yearOfPassing: app.year_of_passing as string | null,
    marksDisplay, // resolved ✅
    institutionName: app.institution_name as string | null,
    institutionAddress: app.institution_address as string | null,

    // ── Bank details ─────────────────────────────────────
    bankName: app.bank_name as string | null,
    branchName: app.branch_name as string | null,
    accountNo: app.account_no as string | null,
    ifscCode: app.ifsc_code as string | null,

    // ── Payment ──────────────────────────────────────────
    paymentStatus: app.payment_status as number | null,
    paymentAmount:
      app.payment_amount != null ? Number(app.payment_amount) : null,
    paymentDate: app.payment_date
      ? new Date(app.payment_date).toISOString()
      : null,
    paymentMode: app.payment_mode as string | null,

    // ── Review / approval / rejection ────────────────────
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

    // ── Personal ─────────────────────────────────────────
    studentName: (s.name ?? null) as string | null,
    phone: (s.phone ?? null) as string | null,
    email: (s.email ?? null) as string | null,
    guardianName: (s.guardian_name ?? null) as string | null,
    genderName: s.gender_id ? getGenderName(s.gender_id) : null, // resolved ✅
    dateOfBirth: (s.date_of_birth ?? null) as string | null,
    casteName: s.caste_id // resolved ✅
      ? (s.other_caste_name ?? getCasteName(s.caste_id))
      : null,
    aadhaarNumber: (s.aadhaar_number ?? null) as string | null,

    // ── Address ──────────────────────────────────────────
    isResidentOfMacArea: s.is_resident_of_mac_area !== false,
    // MAC-area
    districtName,
    panchayatName: (s.panchayat_name ?? null) as string | null,
    municipalArea: (s.municipal_area ?? null) as string | null,
    otherVillageName: (s.other_village_name ?? null) as string | null,
    // Outside MAC
    stateName: s.state_id ? getStateName(s.state_id) : null, // resolved ✅
    city: (s.city ?? null) as string | null,
    permanentAddress: (s.permanent_address ?? null) as string | null,
    presentAddress: (s.present_address ?? null) as string | null,
    pinCode: (s.pin_code ?? null) as string | null,
  };
};
