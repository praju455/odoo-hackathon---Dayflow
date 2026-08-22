import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generatePayslip(user: any, breakdown: any) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Dayflow Inc.", 105, 20, { align: "center" });
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Salary Slip", 105, 28, { align: "center" });

  // Employee Details
  doc.setFontSize(11);
  doc.text(`Employee Name: ${user.name}`, 14, 45);
  doc.text(`Employee ID: ${user.loginId}`, 14, 52);
  doc.text(`Department: ${user.department || "N/A"}`, 14, 59);
  
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  doc.text(`Pay Period: ${currentMonth}`, 14, 66);

  // Earnings Table
  const earningsData = breakdown.earnings.map((e: any) => [e.name, `Rs. ${e.calculatedAmount.toFixed(2)}`]);
  earningsData.unshift(["Basic Wage", `Rs. ${breakdown.fixedWage.toFixed(2)}`]);

  autoTable(doc, {
    startY: 75,
    head: [['Earnings', 'Amount']],
    body: earningsData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
  });

  const finalY1 = (doc as any).lastAutoTable.finalY;

  // Deductions Table
  const deductionsData = [
    ["Employee PF", `Rs. ${breakdown.deductions.pfEmployee.toFixed(2)}`],
    ["Professional Tax", `Rs. ${breakdown.deductions.professionalTax.toFixed(2)}`]
  ];

  autoTable(doc, {
    startY: finalY1 + 10,
    head: [['Deductions', 'Amount']],
    body: deductionsData,
    theme: 'striped',
    headStyles: { fillColor: [239, 68, 68] }, // Red-500
  });

  const finalY2 = (doc as any).lastAutoTable.finalY;

  // Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Gross Earnings: Rs. ${breakdown.grossEarnings.toFixed(2)}`, 14, finalY2 + 15);
  doc.text(`Total Deductions: Rs. ${breakdown.deductions.totalDeductions.toFixed(2)}`, 14, finalY2 + 22);
  
  doc.setFontSize(14);
  doc.text(`Net Pay: Rs. ${breakdown.netSalary.toFixed(2)}`, 14, finalY2 + 32);

  // Footer
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("This is a system-generated payslip and does not require a signature.", 105, 280, { align: "center" });

  // Download
  doc.save(`${user.loginId}_Payslip_${currentMonth}.pdf`);
}
