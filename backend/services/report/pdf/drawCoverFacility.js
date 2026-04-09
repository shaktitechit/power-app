import { formatCellValue } from "./formatting.js";
import { contentLeft, contentWidth, drawSectionTitle } from "./drawPrimitives.js";
import { drawKeyValueBlock, drawSubSection } from "./drawTables.js";
import { PDF_THEME } from "./styles.js";

export const drawCoverPage = (doc, cover, meta, theme = PDF_THEME) => {
  const x = contentLeft(doc);
  const w = contentWidth(doc);
  let y = doc.page.margins.top;

  doc.save();
  doc.rect(0, 0, doc.page.width, 8).fill(theme.colors.coverBar);
  doc.restore();

  y += 36;
  const brand =
    cover?.branding?.company_name || "Shakti Power Solutions Private Limited";
  doc.save();
  doc
    .font(theme.font.family)
    .fontSize(10)
    .fillColor(theme.colors.muted)
    .text(brand, x, y, { width: w, align: "center" });
  doc.restore();
  y = doc.y + 28;

  const title =
    cover?.title || meta?.title || formatCellValue(meta?.report_type) || "Report";
  doc
    .font(theme.font.familyBold)
    .fontSize(theme.font.title)
    .fillColor(theme.colors.accent)
    .text(String(title), x, y, { width: w, align: "center" });
  y = doc.y + 18;

  if (cover?.subtitle) {
    doc
      .font(theme.font.family)
      .fontSize(theme.font.coverSubtitle)
      .fillColor(theme.colors.text)
      .text(String(cover.subtitle), x, y, { width: w, align: "center" });
    y = doc.y + 22;
  }

  const metaLine = [cover?.report_type_label, cover?.report_scope_label]
    .filter(Boolean)
    .join("   •   ");
  if (metaLine) {
    doc
      .font(theme.font.family)
      .fontSize(10)
      .fillColor(theme.colors.muted)
      .text(metaLine, x, y, { width: w, align: "center" });
    y = doc.y + 28;
  }

  if (cover?.report_period?.label) {
    doc
      .font(theme.font.familyBold)
      .fontSize(10)
      .fillColor(theme.colors.text)
      .text("Report period", x, y, { width: w, align: "center" });
    y = doc.y + 4;
    doc
      .font(theme.font.family)
      .fontSize(10)
      .fillColor(theme.colors.muted)
      .text(String(cover.report_period.label), x, y, { width: w, align: "center" });
    y = doc.y + 24;
  }

  const preparedName = cover?.prepared_for?.facility_name;
  const preparedCity = cover?.prepared_for?.facility_city;
  const preparedLine = [preparedName, preparedCity].filter(Boolean).join(" — ");
  if (preparedLine) {
    doc
      .font(theme.font.familyBold)
      .fontSize(10)
      .fillColor(theme.colors.text)
      .text("Prepared for", x, y, { width: w, align: "center" });
    y = doc.y + 4;
    doc
      .font(theme.font.family)
      .fontSize(10)
      .fillColor(theme.colors.muted)
      .text(preparedLine, x, y, { width: w, align: "center" });
    y = doc.y + 24;
  }

  const genLabel =
    cover?.dates?.generated_at_label ||
    (meta?.generated_at
      ? new Date(meta.generated_at).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB"));
  doc
    .font(theme.font.family)
    .fontSize(9)
    .fillColor(theme.colors.muted)
    .text(`Generated on ${genLabel}`, x, y, { width: w, align: "center" });
  y = doc.y + 32;

  const rid = cover?.identifiers?.report_id;
  if (rid) {
    doc
      .font(theme.font.family)
      .fontSize(8)
      .fillColor(theme.colors.muted)
      .text(`Reference ID: ${rid}`, x, y, { width: w, align: "center" });
  }

  doc.fillColor(theme.colors.text);
};

export const drawMinimalCoverFromMeta = (doc, meta, theme = PDF_THEME) => {
  const x = contentLeft(doc);
  const w = contentWidth(doc);
  let y = doc.page.margins.top + 24;

  doc.save();
  doc.rect(0, 0, doc.page.width, 6).fill(theme.colors.coverBar);
  doc.restore();

  doc
    .font(theme.font.familyBold)
    .fontSize(theme.font.title)
    .fillColor(theme.colors.accent)
    .text(String(meta?.title || "Energy audit report"), x, y, {
      width: w,
      align: "center",
    });
  y = doc.y + 12;
  doc
    .font(theme.font.family)
    .fontSize(10)
    .fillColor(theme.colors.muted)
    .text(
      `Scope: ${formatCellValue(meta?.report_scope)}   •   Type: ${formatCellValue(meta?.report_type)}`,
      x,
      y,
      { width: w, align: "center" },
    );
  y = doc.y + 16;
  doc
    .font(theme.font.family)
    .fontSize(9)
    .fillColor(theme.colors.muted)
    .text(
      `Generated: ${meta?.generated_at ? new Date(meta.generated_at).toLocaleString("en-GB") : new Date().toLocaleString("en-GB")}`,
      x,
      y,
      { width: w, align: "center" },
    );
  doc.fillColor(theme.colors.text);
};

export const drawFacilityInfoPage = (doc, facilityInfo, theme = PDF_THEME) => {
  let y = drawSectionTitle(
    doc,
    facilityInfo?.title || "Facility information",
    theme,
    doc.page.margins.top,
  );

  const subs = facilityInfo?.sections;
  if (Array.isArray(subs) && subs.length) {
    subs.forEach((sub) => {
      y = drawSubSection(doc, theme, y, sub);
    });
    return;
  }

  const rows = facilityInfo?.display_rows;
  if (Array.isArray(rows) && rows.length) {
    drawKeyValueBlock(
      doc,
      theme,
      y,
      "Details",
      rows.map((r) => ({ label: r.label, value: r.value })),
    );
  }
};
