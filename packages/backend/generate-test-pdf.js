const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

console.log('Generating test compliance report PDF...');

// Create a new PDF document
const doc = new PDFDocument({ size: 'LETTER', margin: 50 });

// Pipe to file
const outputPath = path.join(__dirname, 'test-compliance-report.pdf');
doc.pipe(fs.createWriteStream(outputPath));

// Colors
const primaryBlue = '#2563eb';
const darkBlue = '#1e40af';
const lightBlue = '#eff6ff';

// Title Page
doc.fontSize(28).fillColor(primaryBlue).text('Compliance Assessment Report', { align: 'center' });
doc.moveDown(1);

doc.fontSize(16).fillColor('#374151').text('Test Organization', { align: 'center' });
doc.moveDown(0.5);

doc.fontSize(12).fillColor('#6b7280')
   .text('Assessment: Test Compliance Report - 2026-01-16', { align: 'center' })
   .text('Framework: NIST Cybersecurity Framework v1.1', { align: 'center' })
   .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

doc.moveDown(3);

// Executive Summary
doc.addPage();
doc.fontSize(20).fillColor(primaryBlue).text('Executive Summary', { underline: true });
doc.moveDown(1);

// Overall Compliance Score Box
doc.rect(150, doc.y, 300, 100).fillAndStroke(lightBlue, darkBlue);
doc.fontSize(14).fillColor('#374151').text('Overall Compliance Score', 200, doc.y - 80, { width: 200, align: 'center' });
doc.fontSize(36).fillColor(primaryBlue).text('75%', 200, doc.y - 55, { width: 200, align: 'center' });

doc.moveDown(8);

// Summary Statistics
doc.fontSize(12).fillColor('#374151');
doc.text('Total Controls Assessed: 39', { continued: false });
doc.text('Fully Implemented: 20 (51%)', { continued: false });
doc.text('Partially Implemented: 10 (26%)', { continued: false });
doc.text('Not Implemented: 9 (23%)', { continued: false });

doc.moveDown(2);

// Key Findings
doc.fontSize(16).fillColor(primaryBlue).text('Key Findings', { underline: true });
doc.moveDown(0.5);
doc.fontSize(11).fillColor('#374151');
doc.list([
  'Strong performance in Identify (ID) function with 85% compliance',
  'Protect (PR) function shows good maturity at 78% compliance',
  'Detect (DE) function requires attention with only 65% compliance',
  'Response (RS) and Recover (RC) functions need improvement'
], { bulletRadius: 2 });

doc.moveDown(2);

// Detailed Results
doc.addPage();
doc.fontSize(20).fillColor(primaryBlue).text('Detailed Assessment Results', { underline: true });
doc.moveDown(1);

// ID Function
doc.fontSize(14).fillColor(darkBlue).text('Identify (ID) Function');
doc.moveDown(0.5);

doc.fontSize(11).fillColor('#374151');
doc.text('ID.AM-1: Physical devices and systems are inventoried');
doc.fontSize(10).fillColor('#10b981').text('Status: Fully Implemented', { indent: 20 });
doc.fontSize(10).fillColor('#6b7280').text('Comments: Asset inventory maintained in ServiceNow CMDB', { indent: 20 });
doc.moveDown(1);

doc.fontSize(11).fillColor('#374151');
doc.text('ID.AM-2: Software platforms and applications are inventoried');
doc.fontSize(10).fillColor('#f59e0b').text('Status: Partially Implemented', { indent: 20 });
doc.fontSize(10).fillColor('#6b7280').text('Comments: Software inventory in progress, 60% complete', { indent: 20 });
doc.moveDown(1);

doc.fontSize(11).fillColor('#374151');
doc.text('ID.AM-3: Organizational communication and data flows are mapped');
doc.fontSize(10).fillColor('#ef4444').text('Status: Not Implemented', { indent: 20 });
doc.fontSize(10).fillColor('#6b7280').text('Comments: Data flow mapping scheduled for Q2', { indent: 20 });

doc.moveDown(2);

// PR Function
doc.fontSize(14).fillColor(darkBlue).text('Protect (PR) Function');
doc.moveDown(0.5);

doc.fontSize(11).fillColor('#374151');
doc.text('PR.AC-1: Identities and credentials are issued, managed, and verified');
doc.fontSize(10).fillColor('#10b981').text('Status: Fully Implemented', { indent: 20 });
doc.fontSize(10).fillColor('#6b7280').text('Comments: Active Directory with MFA enabled', { indent: 20 });
doc.moveDown(1);

// Recommendations
doc.addPage();
doc.fontSize(20).fillColor(primaryBlue).text('Recommendations', { underline: true });
doc.moveDown(1);

doc.fontSize(14).fillColor('#ef4444').text('High Priority', { underline: true });
doc.moveDown(0.5);
doc.fontSize(11).fillColor('#374151');
doc.list([
  'Complete data flow mapping for ID.AM-3',
  'Implement incident response procedures',
  'Establish backup and recovery processes'
], { bulletRadius: 2, indent: 10 });

doc.moveDown(1);

doc.fontSize(14).fillColor('#f59e0b').text('Medium Priority', { underline: true });
doc.moveDown(0.5);
doc.fontSize(11).fillColor('#374151');
doc.list([
  'Complete software inventory for ID.AM-2',
  'Enhance logging and monitoring capabilities',
  'Conduct security awareness training'
], { bulletRadius: 2, indent: 10 });

doc.moveDown(2);

// Footer on last page
doc.fontSize(10).fillColor('#6b7280').text(
  'This report was generated automatically by the Compliance Platform',
  50,
  doc.page.height - 50,
  { align: 'center' }
);

// Finalize PDF
doc.end();

console.log('✓ PDF generated successfully:', outputPath);
console.log('  Open test-compliance-report.pdf to view the report');
