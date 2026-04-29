import { PDF_THEME } from "./styles.js";
import { sanitizePdfText } from "./formatting.js";
import { getUtilityAccountSectionTintFromHeading } from "../utilityAccountSectionTint.js";

export const contentWidth = (doc) =>
  doc.page.width - doc.page.margins.left - doc.page.margins.right;

export const contentLeft = (doc) => doc.page.margins.left;

export const pageBottom = (doc) => doc.page.height - doc.page.margins.bottom;

/**
 * @returns {number} y position after ensuring space (may add page)
 */
export const ensureSpace = (doc, y, minHeightNeeded) => {
  const limit = pageBottom(doc);
  if (y + minHeightNeeded > limit) {
    doc.addPage();
    return doc.page.margins.top;
  }
  return y;
};

export const drawSectionTitle = (doc, title, theme = PDF_THEME, y) => {
  const x = contentLeft(doc);
  const w = contentWidth(doc);
  y = ensureSpace(doc, y, 36);
  doc.save();
  doc
    .fillColor(theme.colors.accent)
    .font(theme.font.familyBold)
    .fontSize(theme.font.sectionTitle)
    .text(sanitizePdfText(title || "Section", "section-title"), x, y, {
      width: w,
    });
  y = doc.y + 4;
  doc
    .strokeColor(theme.colors.accent)
    .lineWidth(2)
    .moveTo(x, y)
    .lineTo(x + w, y)
    .stroke();
  doc.fillColor(theme.colors.text);
  doc.restore();
  return y + theme.spacing.sectionGap;
};

export const drawSubsectionHeading = (
  doc,
  heading,
  theme = PDF_THEME,
  y,
  tintResolver = null,
) => {
  if (!heading) return y;
  const x = contentLeft(doc);
  const w = contentWidth(doc);
  y = ensureSpace(doc, y, 22);
  const tint = tintResolver
    ? tintResolver.fromHeading(heading)?.hex ?? null
    : getUtilityAccountSectionTintFromHeading(heading)?.hex ?? null;
  doc.save();
  if (tint) {
    const boxHeight = theme.font.subsection + 8;
    doc
      .roundedRect(x, y - 2, w, boxHeight, 3)
      .fillColor(tint)
      .fill();
  }
  doc
    .fillColor(theme.colors.text)
    .font(theme.font.familyBold)
    .fontSize(theme.font.subsection)
    .text(sanitizePdfText(heading, "subsection-heading"), x, y, { width: w });
  doc.restore();
  return doc.y + 6;
};

export const drawPageFooter = (doc, pageIndex, totalPages, theme = PDF_THEME) => {
  const left = doc.page.margins.left;
  const w = contentWidth(doc);
  const y = doc.page.height - 28;
  doc.save();
  doc
    .font(theme.font.family)
    .fontSize(theme.font.footer)
    .fillColor(theme.colors.muted)
    .text(`Page ${pageIndex + 1} of ${totalPages}`, left, y, {
      width: w,
      align: "center",
    });
  doc.restore();
};
