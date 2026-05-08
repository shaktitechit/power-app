import { buildFacilityReportData } from "./backend/services/report/builders/safety-audit/buildFacilityReportData.js";
import { generateExcelReport } from "./backend/services/report/render/excel/generateExcelReport.js";
import fs from "fs";

// Mock data for safety audit report with valid ObjectIDs
const mockReport = {
  report_type: "full_audit_report",
  _id: "65f1a2d3b4c8e9a0f1e2d3c4", // Valid 24-character hex ID
};

const mockFacility = {
  _id: "65f1a2d3b4c8e9a0f1e2d3c5", // Valid 24-character hex ID
  name: "Test Facility",
};

const mockMeta = {
  title: "Test Safety Audit Report",
  report_scope: "facility",
  report_type: "full_audit_report",
  generated_at: new Date(),
};

async function testSafetyReport() {
  try {
    // Generate report payload
    const reportData = await buildFacilityReportData({
      report: mockReport,
      facility: mockFacility,
      meta: mockMeta,
    });

    console.log("Report payload generated successfully");
    console.log(
      `Combined safety section blocks: ${reportData.sheet_sections.find((s) => s.key === "safety_audit_combined")?.blocks.length || 0}`,
    );

    // Generate Excel report
    const buffer = await generateExcelReport({ reportData });
    fs.writeFileSync("test-safety-report.xlsx", buffer);
    console.log("Excel report generated: test-safety-report.xlsx");
  } catch (error) {
    console.error("Error generating test report:", error);
  }
}

testSafetyReport();
