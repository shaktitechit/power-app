/**
 * PDF report visual theme (PDFKit-friendly).
 * Adjust here for brand colours and typography without touching builders.
 */
export const PDF_THEME = {
  page: {
    margin: 48,
    size: "A4",
  },

  colors: {
    accent: "#0d47a1",
    accentLight: "#e3f2fd",
    text: "#1a1a1a",
    muted: "#616161",
    border: "#bdbdbd",
    headerBg: "#1565c0",
    headerText: "#ffffff",
    zebra: "#f5f5f5",
    coverBar: "#0d47a1",
  },

  font: {
    family: "Helvetica",
    familyBold: "Helvetica-Bold",
    title: 22,
    coverSubtitle: 12,
    sectionTitle: 15,
    subsection: 11,
    body: 9,
    tableHeader: 8,
    tableBody: 7.5,
    footer: 8,
    caption: 8,
  },

  spacing: {
    sectionGap: 14,
    blockGap: 10,
    line: 1.15,
  },
};

export default PDF_THEME;
