/** Safety audit report section builders (electrical safety checklist + summary). */

import { SAFETY_REPORT_MODEL_SPECS } from "../reportModelRegistry.js";

import { buildSafetyAdditionalItemsSection } from "./buildSafetyAdditionalItemsSection.js";
import { buildSafetyDgSection } from "./buildSafetyDgSection.js";
import { buildSafetyDocumentsSection } from "./buildSafetyDocumentsSection.js";
import { buildSafetyEarthingSection } from "./buildSafetyEarthingSection.js";
import { buildSafetyElevatorSection } from "./buildSafetyElevatorSection.js";
import { buildSafetyExecutiveSummarySheet } from "./buildSafetyExecutiveSummarySection.js";
import { buildSafetyGeneralSection } from "./buildSafetyGeneralSection.js";
import { buildSafetyLeakInspectionSection } from "./buildSafetyLeakInspectionSection.js";
import { buildSafetyLdbSection } from "./buildSafetyLdbSection.js";
import { buildSafetyLoadAnalysisSection } from "./buildSafetyLoadAnalysisSection.js";
import { buildSafetyMeteringRoomSection } from "./buildSafetyMeteringRoomSection.js";
import { buildSafetyPacVentilationSection } from "./buildSafetyPacVentilationSection.js";
import { buildSafetyPanelRoomSection } from "./buildSafetyPanelRoomSection.js";
import { buildSafetyPumpCompressorSection } from "./buildSafetyPumpCompressorSection.js";
import { buildSafetyReportSummaryMeta } from "./buildSafetyReportSummaryMeta.js";
import { buildSafetyThermographySection } from "./buildSafetyThermographySection.js";
import { buildSafetyTransformerSection } from "./buildSafetyTransformerSection.js";
import { buildSafetyUpsSection } from "./buildSafetyUpsSection.js";
import { buildSafetyWiringSection } from "./buildSafetyWiringSection.js";
import {
  aggregateDocStats,
  buildQuery,
  buildSafetyAccountMap,
  buildSafetyChecklistSection,
  createSafetySectionBuilder,
  fetchDocsForModel,
  ITEM_COLUMNS,
  safetyChecklistSectionToTableBlocks,
} from "./safetyChecklistSection.js";

export {
  aggregateDocStats,
  buildQuery,
  buildSafetyAccountMap,
  buildSafetyChecklistSection,
  createSafetySectionBuilder,
  fetchDocsForModel,
  ITEM_COLUMNS,
  safetyChecklistSectionToTableBlocks,
};

export { buildSafetyExecutiveSummarySheet };
export { buildSafetyReportSummaryMeta };

export { buildSafetyGeneralSection };
export { buildSafetyDocumentsSection };
export { buildSafetyEarthingSection };
export { buildSafetyPanelRoomSection };
export { buildSafetyMeteringRoomSection };
export { buildSafetyLdbSection };
export { buildSafetyTransformerSection };
export { buildSafetyDgSection };
export { buildSafetyUpsSection };
export { buildSafetyWiringSection };
export { buildSafetyLoadAnalysisSection };
export { buildSafetyLeakInspectionSection };
export { buildSafetyThermographySection };
export { buildSafetyPumpCompressorSection };
export { buildSafetyElevatorSection };
export { buildSafetyPacVentilationSection };
export { buildSafetyAdditionalItemsSection };

/** Full-audit checklist builders — order follows `reportModelRegistry`. */
export const SAFETY_CHECKLIST_SECTION_BUILDERS =
  SAFETY_REPORT_MODEL_SPECS.map((s) => createSafetySectionBuilder(s.key));
