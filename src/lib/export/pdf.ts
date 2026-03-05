import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportPDF(
  data: Record<string, unknown>[],
  filename: string,
  title?: string
) {
  const doc = new jsPDF();
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
  }

  if (data.length > 0) {
    const columns = Object.keys(data[0]);
    const rows = data.map((row) => columns.map((col) => String(row[col] ?? "")));
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: title ? 30 : 14,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [96, 165, 250] },
    });
  }

  doc.save(`${filename}.pdf`);
}
