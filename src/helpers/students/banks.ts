export const BANKS = Object.freeze({
  // PUBLIC SECTOR BANKS
  STATE_BANK_OF_INDIA: 1,
  PUNJAB_NATIONAL_BANK: 2,
  BANK_OF_BARODA: 3,
  CANARA_BANK: 4,
  UNION_BANK_OF_INDIA: 5,
  BANK_OF_INDIA: 6,
  INDIAN_BANK: 7,
  CENTRAL_BANK_OF_INDIA: 8,
  INDIAN_OVERSEAS_BANK: 9,
  UCO_BANK: 10,
  BANK_OF_MAHARASHTRA: 11,
  PUNJAB_AND_SIND_BANK: 12,

  // PRIVATE SECTOR BANKS
  HDFC_BANK: 13,
  ICICI_BANK: 14,
  AXIS_BANK: 15,
  KOTAK_MAHINDRA_BANK: 16,
  INDUSIND_BANK: 17,
  YES_BANK: 18,
  IDFC_FIRST_BANK: 19,
  FEDERAL_BANK: 20,
  SOUTH_INDIAN_BANK: 21,
  KARNATAKA_BANK: 22,
  KARUR_VYSYA_BANK: 23,
  TAMILNAD_MERCANTILE_BANK: 24,
  RBL_BANK: 25,
  BANDHAN_BANK: 26,
  CITY_UNION_BANK: 27,
  DHANLAXMI_BANK: 28,
  CSB_BANK: 29,
  NAINITAL_BANK: 30,

  // RURAL / COOPERATIVE BANKS (ASSAM)
  ASSAM_GRAMIN_VIKASH_BANK: 31,
  ASSAM_CO_OPERATIVE_APEX_BANK: 32,
  LANGPI_DEHANG_RURAL_BANK: 33,

  // SMALL FINANCE / PAYMENTS BANKS
  INDIA_POST_PAYMENTS_BANK: 34,
  AIRTEL_PAYMENTS_BANK: 35,
});

// ===============================
// BANK NAMES MAP
// ===============================

export const BANK_NAMES: Record<number, string> = Object.freeze({
  // Public Sector
  1: "State Bank of India",
  2: "Punjab National Bank",
  3: "Bank of Baroda",
  4: "Canara Bank",
  5: "Union Bank of India",
  6: "Bank of India",
  7: "Indian Bank",
  8: "Central Bank of India",
  9: "Indian Overseas Bank",
  10: "UCO Bank",
  11: "Bank of Maharashtra",
  12: "Punjab & Sind Bank",

  // Private Sector
  13: "HDFC Bank",
  14: "ICICI Bank",
  15: "Axis Bank",
  16: "Kotak Mahindra Bank",
  17: "IndusInd Bank",
  18: "Yes Bank",
  19: "IDFC FIRST Bank",
  20: "Federal Bank",
  21: "South Indian Bank",
  22: "Karnataka Bank",
  23: "Karur Vysya Bank",
  24: "Tamilnad Mercantile Bank",
  25: "RBL Bank",
  26: "Bandhan Bank",
  27: "City Union Bank",
  28: "Dhanlaxmi Bank",
  29: "CSB Bank",
  30: "Nainital Bank",

  // Rural / Cooperative Assam
  31: "Assam Gramin Vikash Bank",
  32: "The Assam Co-operative Apex Bank",
  33: "Langpi Dehangi Rural Bank",

  // Small Finance / Payments
  34: "India Post Payments Bank",
  35: "Airtel Payments Bank",
});

export const BANK_OPTIONS = Object.entries(BANK_NAMES).map(([id, label]) => ({
  value: Number(id),
  label,
}));

export function getBankName(value: number) {
  const option = BANK_OPTIONS.find((opt) => opt.value == value);
  return option ? option.label : "";
}
