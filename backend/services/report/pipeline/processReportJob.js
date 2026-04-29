import { executeReportGenerationJob } from "./executeReportGenerationJob.js";

/** Worker entry: delegates to job orchestration (load entities → builders → files → persist). */
export const processReportJob = async ({ job }) =>
  executeReportGenerationJob({ job });

export default processReportJob;
