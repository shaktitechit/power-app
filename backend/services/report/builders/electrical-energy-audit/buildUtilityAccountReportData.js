import { assembleReportPayload } from "./assembleReportPayload.js";

const throwError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

/**
 * Electrical Energy Audit — utility-account-scoped report dataset.
 */
export const buildUtilityAccountReportData = async ({
  report,
  facility,
  utilityAccount,
  meta,
}) => {
  if (!utilityAccount) {
    throwError(
      "utilityAccount is required in buildUtilityAccountReportData",
      500,
    );
  }

  return assembleReportPayload({
    report,
    facility,
    utilityAccount,
    meta,
    scope: "utility_account",
  });
};

export default buildUtilityAccountReportData;
