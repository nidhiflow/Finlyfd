import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

function newDoc(title: string, subtitle?: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text("Finly", 40, 40);
  doc.setFontSize(13);
  doc.text(title, 40, 62);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(subtitle, 40, 78);
  }
  return doc;
}

function download(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function exportTransactionsPDF(
  transactions: any[],
  accountNameById: Map<string, string>,
  categoryNameById: Map<string, string>
) {
  const doc = newDoc("Transactions", `Generated ${new Date().toLocaleDateString()} · ${transactions.length} transactions`);

  const rows = transactions.map((t) => [
    t.date?.substring(0, 10) || "",
    (t.type || "").charAt(0).toUpperCase() + (t.type || "").slice(1),
    categoryNameById.get(t.category_id) || t.category_id || "—",
    accountNameById.get(t.account_id) || "—",
    t.note || t.description || "",
    (t.type === "income" ? "+" : t.type === "expense" ? "-" : "") + parseFloat(t.amount || 0).toFixed(2),
  ]);

  autoTable(doc, {
    startY: 92,
    head: [["Date", "Type", "Category", "Account", "Note", "Amount"]],
    body: rows,
    styles: { fontSize: 8, cellPadding: 5 },
    headStyles: { fillColor: [212, 162, 76], textColor: [20, 20, 20] },
    columnStyles: { 5: { halign: "right" } },
  });

  download(doc, `finly-transactions-${new Date().toISOString().split("T")[0]}.pdf`);
}

export function exportReportPDF(params: {
  periodLabel: string;
  chartType: "expense" | "income";
  totalIncome: number;
  totalExpense: number;
  categories: { name: string; amount: number; percentage: number }[];
}) {
  const { periodLabel, chartType, totalIncome, totalExpense, categories } = params;
  const doc = newDoc(`${periodLabel} Report`, `Generated ${new Date().toLocaleDateString()}`);

  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(`Total Income: Rs. ${totalIncome.toFixed(2)}`, 40, 100);
  doc.text(`Total Expense: Rs. ${totalExpense.toFixed(2)}`, 40, 116);
  doc.setFontSize(12);
  const [r, g, b] = chartType === "income" ? [34, 197, 94] : [239, 68, 68];
  doc.setTextColor(r, g, b);
  doc.text(`${chartType === "income" ? "Income" : "Expense"} Breakdown by Category`, 40, 140);

  autoTable(doc, {
    startY: 154,
    head: [["Category", "Amount", "% of Total"]],
    body: categories.map((c) => [c.name, `Rs. ${c.amount.toFixed(2)}`, `${c.percentage.toFixed(1)}%`]),
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [212, 162, 76], textColor: [20, 20, 20] },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } },
  });

  download(doc, `finly-report-${periodLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
