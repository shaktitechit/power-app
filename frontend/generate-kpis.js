const fs = require('fs');
const path = require('path');

const files = [
  'ac-audit-records',
  'billing-records',
  'dg-sets',
  'fan-audit-records',
  'hvac-audits',
  'lighting-audits',
  'lux-measurements',
  'misc-load-audits',
  'pumps',
  'solar-plants',
  'tariffs',
  'transformers'
];

files.forEach(file => {
  const name = file.replace(/-/g, ' ');
  const titleCase = name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) + ' Summary';
  
  const componentName = file.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Table';
  const funcName = 'compute' + file.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Kpis';

  const kpiContent = `import { computeEnergyAuditColumnKpis, EnergyKpiSection } from "../../audit-snapshot-kpi-summary";

export function ${funcName}(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  const kpis = computeEnergyAuditColumnKpis(rows, columns);
  
  // Custom KPI filtering or logic specific to ${titleCase}
  // can be added here in the future
  return [
    {
      id: "${file}_dataset",
      title: "${titleCase}",
      subtitle: \`\${rows.length} record\${rows.length === 1 ? '' : 's'} analyzed in this dataset\`,
      kpis,
    },
  ];
}
`;

  fs.writeFileSync(path.join('c:/Users/Dell/Desktop/power-app/power-app/frontend/app/audits/_components/energy/tables/kpis', file + '-kpis.ts'), kpiContent, 'utf8');

  const tableContent = `"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "../base-energy-table";
import { ${funcName} } from "./kpis/${file}-kpis";

export function ${componentName}(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={${funcName}}
    />
  );
}
`;

  fs.writeFileSync(path.join('c:/Users/Dell/Desktop/power-app/power-app/frontend/app/audits/_components/energy/tables', file + '-table.tsx'), tableContent, 'utf8');
});
