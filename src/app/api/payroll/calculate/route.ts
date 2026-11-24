import { NextRequest, NextResponse } from "next/server";
import { calculateEmployeePayslip, FX_TO_USD } from "@/lib/payroll-engine";
import type { Employee } from "@/types/hris";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      employees: Employee[];
      overtimeMap?: Record<string, number>;
      bonusMap?: Record<string, number>;
      period?: string;
    };

    if (!Array.isArray(body.employees) || body.employees.length === 0) {
      return NextResponse.json(
        { ok: false, error: "employees array is required" },
        { status: 400 }
      );
    }

    const items = body.employees.map((emp) =>
      calculateEmployeePayslip(
        emp,
        body.overtimeMap?.[emp.id] || 0,
        body.bonusMap?.[emp.id] || 0
      )
    );

    const totalGrossUSD = Math.round(
      items.reduce((acc, i) => acc + i.grossSalary * FX_TO_USD[i.currency], 0)
    );
    const totalNetUSD = Math.round(
      items.reduce((acc, i) => acc + i.netSalary * FX_TO_USD[i.currency], 0)
    );

    return NextResponse.json({
      ok: true,
      payrollRun: {
        id: `pr_${Date.now()}`,
        period: body.period || new Date().toISOString().slice(0, 7),
        label: `Automated Global Payroll (${body.period || new Date().toISOString().slice(0, 7)})`,
        runDate: new Date().toISOString(),
        status: "Completed",
        totalEmployees: items.length,
        totalGrossUSD,
        totalNetUSD,
        items,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Payroll calculation failed" },
      { status: 500 }
    );
  }
}
