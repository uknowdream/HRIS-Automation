import type { Currency, Employee, PayslipItem } from "@/types/hris";

// Exchange rates normalized to USD for global consolidation
export const FX_TO_USD: Record<Currency, number> = {
  USD: 1,
  IDR: 1 / 16000,
  SGD: 0.74,
  EUR: 1.08,
  GBP: 1.27,
};

export function formatCurrency(amount: number, currency: Currency): string {
  const rounded = currency === "IDR" ? Math.round(amount) : Math.round(amount * 100) / 100;
  const formatted = rounded
    .toFixed(currency === "IDR" ? 0 : 2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, currency === "IDR" || currency === "EUR" ? "." : ",");
  const prefixMap: Record<Currency, string> = {
    IDR: "Rp ",
    USD: "$",
    SGD: "S$",
    EUR: "€",
    GBP: "£",
  };
  return `${prefixMap[currency]}${formatted}`;
}

/**
 * Indonesian PPh 21 TER (Tarif Efektif Rata-Rata) PP 58/2023 approximation by PTKP Category A/B/C
 */
function calculateIndonesianTerRate(grossIdr: number, taxStatus: Employee["taxStatus"]): { rate: number; category: string } {
  const category =
    taxStatus === "K/3"
      ? "TER C"
      : taxStatus === "K/1" || taxStatus === "K/2"
      ? "TER B"
      : "TER A";

  if (category === "TER A") {
    if (grossIdr <= 5_400_000) return { rate: 0, category };
    if (grossIdr <= 7_500_000) return { rate: 0.0125, category };
    if (grossIdr <= 10_050_000) return { rate: 0.02, category };
    if (grossIdr <= 15_100_000) return { rate: 0.06, category };
    if (grossIdr <= 25_000_000) return { rate: 0.1, category };
    if (grossIdr <= 40_000_000) return { rate: 0.15, category };
    if (grossIdr <= 70_000_000) return { rate: 0.21, category };
    return { rate: 0.26, category };
  }
  if (category === "TER B") {
    if (grossIdr <= 6_200_000) return { rate: 0, category };
    if (grossIdr <= 9_200_000) return { rate: 0.015, category };
    if (grossIdr <= 15_000_000) return { rate: 0.05, category };
    if (grossIdr <= 25_000_000) return { rate: 0.09, category };
    if (grossIdr <= 45_000_000) return { rate: 0.14, category };
    return { rate: 0.22, category };
  }
  // TER C
  if (grossIdr <= 6_600_000) return { rate: 0, category };
  if (grossIdr <= 12_000_000) return { rate: 0.03, category };
  if (grossIdr <= 25_000_000) return { rate: 0.08, category };
  if (grossIdr <= 50_000_000) return { rate: 0.13, category };
  return { rate: 0.2, category };
}

export function calculateEmployeePayslip(
  employee: Employee,
  overtimeHours = 0,
  bonus = 0
): PayslipItem {
  const hourlyRate = employee.baseSalary / 173;
  const overtimePay = Math.round(hourlyRate * 1.5 * overtimeHours);
  const grossSalary = employee.baseSalary + employee.allowances + overtimePay + bonus;

  let incomeTax = 0;
  let bpjsHealth = 0;
  let bpjsEmployment = 0;
  let employerContributions = 0;
  let taxRateLabel = "";

  if (employee.currency === "IDR") {
    // Indonesian statutory payroll calculation
    const ter = calculateIndonesianTerRate(grossSalary, employee.taxStatus);
    incomeTax = Math.round(grossSalary * ter.rate);
    const bpjsHealthBase = Math.min(employee.baseSalary, 12_000_000);
    const bpjsJpBase = Math.min(employee.baseSalary, 10_042_300);
    bpjsHealth = Math.round(bpjsHealthBase * 0.01); // 1% employee
    const jhtEmployee = Math.round(employee.baseSalary * 0.02); // 2% JHT
    const jpEmployee = Math.round(bpjsJpBase * 0.01); // 1% JP
    bpjsEmployment = jhtEmployee + jpEmployee;
    employerContributions = Math.round(
      bpjsHealthBase * 0.04 + // 4% BPJS Kesehatan
        employee.baseSalary * 0.037 + // 3.7% JHT
        bpjsJpBase * 0.02 + // 2% JP
        employee.baseSalary * 0.0054 // JKK + JKM
    );
    taxRateLabel = `PPh 21 ${ter.category} (${(ter.rate * 100).toFixed(2)}%)`;
  } else if (employee.currency === "SGD") {
    // Singapore CPF + IRAS withholding approximation
    const cpfBase = Math.min(grossSalary, 7400);
    bpjsEmployment = Math.round(cpfBase * 0.2); // 20% Employee CPF
    employerContributions = Math.round(cpfBase * 0.17); // 17% Employer CPF
    incomeTax = Math.round(grossSalary * 0.07);
    taxRateLabel = "IRAS / CPF SG (7% + 20% CPF)";
  } else if (employee.currency === "USD") {
    // US Federal + FICA approximation
    incomeTax = Math.round(grossSalary * 0.22);
    bpjsHealth = Math.round(grossSalary * 0.0145); // Medicare
    bpjsEmployment = Math.round(Math.min(grossSalary, 14000) * 0.062); // Social Security
    employerContributions = Math.round(grossSalary * 0.0765);
    taxRateLabel = "US Fed + FICA (22% + 7.65%)";
  } else if (employee.currency === "EUR") {
    incomeTax = Math.round(grossSalary * 0.24);
    bpjsHealth = Math.round(grossSalary * 0.073);
    bpjsEmployment = Math.round(grossSalary * 0.093);
    employerContributions = Math.round(grossSalary * 0.195);
    taxRateLabel = "EU Income Tax + Social Sec";
  } else {
    // GBP PAYE + National Insurance
    incomeTax = Math.round(grossSalary * 0.2);
    bpjsEmployment = Math.round(grossSalary * 0.08);
    employerContributions = Math.round(grossSalary * 0.138);
    taxRateLabel = "UK PAYE + NI";
  }

  const otherDeductions = 0;
  const netSalary = Math.max(
    0,
    grossSalary - incomeTax - bpjsHealth - bpjsEmployment - otherDeductions
  );

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    employeeCode: employee.employeeCode,
    department: employee.department,
    role: employee.role,
    currency: employee.currency,
    baseSalary: employee.baseSalary,
    allowances: employee.allowances + bonus,
    overtimePay,
    grossSalary,
    incomeTax,
    bpjsHealth,
    bpjsEmployment,
    otherDeductions,
    netSalary,
    employerContributions,
    taxRateLabel,
    status: "Paid",
    dispatchedVia: ["Email", "WhatsApp"],
  };
}

/**
 * Indonesian Statutory Overtime (SPL) per PP 35/2021 & Kepmenaker:
 * Hourly base = 1 / 173 × monthly wage.
 * Weekday: 1st hour = 1.5x, hours 2+ = 2.0x.
 * Weekend / Public Holiday (5-day workweek): hours 1-8 = 2.0x, hour 9 = 3.0x, hours 10+ = 4.0x.
 */
export function calculateOvertimePayKepmenaker(
  monthlyFixedWage: number,
  hours: number,
  isHoliday = false
): { totalPay: number; weightedHours: number; formulaLabel: string } {
  const safeHours = Math.max(0, Math.min(12, hours));
  const hourly = monthlyFixedWage / 173;
  let weightedHours = 0;

  if (!isHoliday) {
    if (safeHours <= 1) {
      weightedHours = safeHours * 1.5;
    } else {
      weightedHours = 1.5 + (safeHours - 1) * 2;
    }
  } else {
    const first8 = Math.min(safeHours, 8);
    const ninth = safeHours > 8 ? Math.min(safeHours - 8, 1) : 0;
    const tenthPlus = safeHours > 9 ? safeHours - 9 : 0;
    weightedHours = first8 * 2 + ninth * 3 + tenthPlus * 4;
  }

  return {
    totalPay: Math.round(hourly * weightedHours),
    weightedHours: Math.round(weightedHours * 100) / 100,
    formulaLabel: isHoliday
      ? `Holiday SPL (${safeHours}h → ${weightedHours.toFixed(1)}x)`
      : `Weekday SPL (${safeHours}h → ${weightedHours.toFixed(1)}x)`,
  };
}

/**
 * Indonesian THR Keagamaan (Permenaker 6/2016) & PKWT Compensation (PP 35/2021)
 */
export function calculateThrAndPkwt(
  baseSalary: number,
  fixedAllowances: number,
  tenureMonths: number
): {
  monthlyFixed: number;
  thrAmount: number;
  thrProRataPct: number;
  pkwtCompensation: number;
  severanceMonthsEstimate: number;
} {
  const monthlyFixed = Math.max(0, baseSalary + fixedAllowances);
  const months = Math.max(1, tenureMonths);
  const thrRatio = Math.min(1, months / 12);
  const thrAmount = Math.round(monthlyFixed * thrRatio);
  const pkwtCompensation = Math.round((months / 12) * monthlyFixed);
  const years = Math.floor(months / 12);
  const severanceMonthsEstimate = Math.min(9, years + 1);
  return {
    monthlyFixed,
    thrAmount,
    thrProRataPct: Math.round(thrRatio * 100),
    pkwtCompensation,
    severanceMonthsEstimate,
  };
}

/**
 * Indonesian Annual PPh 21 Form 1721-A1 Summary (UU HPP Progressive Brackets)
 */
export function calculateAnnual1721A1(employee: Employee): {
  annualGross: number;
  biayaJabatan: number;
  annualBpjsEmployee: number;
  ptkp: number;
  pkp: number;
  annualTax: number;
  effectiveRatePct: number;
} {
  const annualGross = (employee.baseSalary + employee.allowances) * 12;
  const biayaJabatan = Math.min(6_000_000, Math.round(annualGross * 0.05));
  const annualBpjsEmployee = Math.round(employee.baseSalary * 0.03 * 12);
  const ptkpTable: Record<Employee["taxStatus"], number> = {
    "TK/0": 54_000_000,
    "TK/1": 58_500_000,
    "K/0": 58_500_000,
    "K/1": 63_000_000,
    "K/2": 67_500_000,
    "K/3": 72_000_000,
  };
  const ptkp = ptkpTable[employee.taxStatus] || 54_000_000;
  const netAnnual = Math.max(0, annualGross - biayaJabatan - annualBpjsEmployee);
  const pkp = Math.max(0, Math.floor((netAnnual - ptkp) / 1000) * 1000);

  let remaining = pkp;
  let annualTax = 0;
  const brackets: [number, number][] = [
    [60_000_000, 0.05],
    [190_000_000, 0.15],
    [250_000_000, 0.25],
    [4_500_000_000, 0.3],
    [Infinity, 0.35],
  ];
  for (const [cap, rate] of brackets) {
    if (remaining <= 0) break;
    const chunk = Math.min(remaining, cap);
    annualTax += Math.round(chunk * rate);
    remaining -= chunk;
  }

  const effectiveRatePct =
    annualGross > 0 ? Math.round((annualTax / annualGross) * 10000) / 100 : 0;

  return {
    annualGross,
    biayaJabatan,
    annualBpjsEmployee,
    ptkp,
    pkp,
    annualTax,
    effectiveRatePct,
  };
}
