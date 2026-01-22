const PDFDocument = require('pdfkit');

/**
 * Compliance Report Generator
 * Generates professional PDF reports for NIST CSF compliance assessments
 */

// Color definitions for status indicators
const STATUS_COLORS = {
  complete: '#10b981',      // Green
  in_progress: '#f59e0b',   // Yellow/Amber
  not_started: '#ef4444',   // Red
  not_applicable: '#6b7280' // Gray
};

// NIST CSF Functions for grouping
const NIST_FUNCTIONS = {
  ID: 'Identify',
  PR: 'Protect',
  DE: 'Detect',
  RS: 'Respond',
  RC: 'Recover'
};

/**
 * Generate a compliance assessment PDF report
 * @param {object} assessmentData - Assessment information
 * @param {array} controlAssessments - Array of control assessment results
 * @param {string} organizationName - Name of the organization
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateCompliancePDF = (assessmentData, controlAssessments, organizationName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'letter',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `NIST CSF Compliance Report - ${assessmentData.assessment_name}`,
          Author: organizationName,
          Subject: 'Cybersecurity Framework Compliance Assessment'
        }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      let pageNumber = 1;

      // Helper function to add page numbers and headers
      const addPageHeader = (title) => {
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;
        
        // Header line
        doc.save()
           .moveTo(50, 30)
           .lineTo(pageWidth - 50, 30)
           .strokeColor('#2563eb')
           .lineWidth(2)
           .stroke()
           .restore();

        // Page number
        doc.fontSize(9)
           .fillColor('#6b7280')
           .text(`Page ${pageNumber}`, 50, pageHeight - 40, {
             align: 'center',
             width: pageWidth - 100
           });

        pageNumber++;
      };

      // ===============================
      // 1. TITLE PAGE
      // ===============================
      doc.fontSize(28)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('NIST Cybersecurity Framework', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(24)
         .fillColor('#2563eb')
         .text('Compliance Assessment Report', { align: 'center' })
         .moveDown(3);

      // Organization info box
      const boxY = doc.y;
      doc.rect(100, boxY, 412, 180)
         .fillAndStroke('#eff6ff', '#2563eb');

      doc.fontSize(14)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('Organization:', 120, boxY + 30)
         .font('Helvetica')
         .fillColor('#374151')
         .text(organizationName, 250, boxY + 30);

      doc.font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('Assessment:', 120, boxY + 60)
         .font('Helvetica')
         .fillColor('#374151')
         .text(assessmentData.assessment_name, 250, boxY + 60);

      doc.font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('Framework Version:', 120, boxY + 90)
         .font('Helvetica')
         .fillColor('#374151')
         .text(assessmentData.framework_version || 'NIST CSF v1.1', 250, boxY + 90);

      doc.font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('Report Date:', 120, boxY + 120)
         .font('Helvetica')
         .fillColor('#374151')
         .text(new Date().toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         }), 250, boxY + 120);

      doc.font('Helvetica-Bold')
         .fillColor('#1e40af')
         .text('Status:', 120, boxY + 150)
         .font('Helvetica')
         .fillColor('#374151')
         .text(assessmentData.assessment_status?.toUpperCase() || 'DRAFT', 250, boxY + 150);

      // ===============================
      // 2. EXECUTIVE SUMMARY
      // ===============================
      doc.addPage();
      addPageHeader('Executive Summary');

      doc.fontSize(20)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('Executive Summary', 50, 80)
         .moveDown(2);

      // Calculate compliance statistics
      const stats = calculateComplianceStats(controlAssessments);

      // Overall Compliance Score
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Overall Compliance Score', { underline: true })
         .moveDown(0.5);

      const scoreY = doc.y;
      const scoreBoxWidth = 150;
      const scoreBoxHeight = 80;

      // Score box
      doc.rect(50, scoreY, scoreBoxWidth, scoreBoxHeight)
         .fillAndStroke(getScoreColor(stats.overallScore), '#374151');

      doc.fontSize(36)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text(`${stats.overallScore}%`, 50, scoreY + 15, {
           width: scoreBoxWidth,
           align: 'center'
         });

      doc.fontSize(12)
         .text('Compliance', 50, scoreY + 55, {
           width: scoreBoxWidth,
           align: 'center'
         });

      // Summary stats next to score
      const statsX = 220;
      doc.fontSize(11)
         .fillColor('#374151')
         .font('Helvetica')
         .text(`Total Controls: ${stats.totalControls}`, statsX, scoreY)
         .text(`Complete: ${stats.complete}`, statsX, scoreY + 20)
         .text(`In Progress: ${stats.inProgress}`, statsX, scoreY + 40)
         .text(`Not Started: ${stats.notStarted}`, statsX, scoreY + 60);

      doc.y = scoreY + scoreBoxHeight + 20;

      // Breakdown by Function
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Compliance by NIST CSF Function', { underline: true })
         .moveDown(1);

      const functionStats = calculateFunctionStats(controlAssessments);
      
      Object.entries(functionStats).forEach(([funcCode, funcData]) => {
        const barY = doc.y;
        const barWidth = 400;
        const barHeight = 20;
        const fillWidth = (funcData.score / 100) * barWidth;

        // Function label
        doc.fontSize(11)
           .fillColor('#374151')
           .font('Helvetica')
           .text(`${NIST_FUNCTIONS[funcCode]} (${funcCode})`, 50, barY);

        // Progress bar background
        doc.rect(50, barY + 15, barWidth, barHeight)
           .fillAndStroke('#e5e7eb', '#9ca3af');

        // Progress bar fill
        if (fillWidth > 0) {
          doc.rect(50, barY + 15, fillWidth, barHeight)
             .fillAndStroke(getScoreColor(funcData.score), '#374151');
        }

        // Percentage label
        doc.fontSize(10)
           .fillColor('#ffffff')
           .font('Helvetica-Bold')
           .text(`${funcData.score}%`, 50, barY + 20, {
             width: barWidth,
             align: 'center'
           });

        // Control counts
        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text(`${funcData.complete}/${funcData.total} controls`, 460, barY + 20);

        doc.moveDown(2);
      });

      // Key Findings
      doc.moveDown(1);
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Key Findings', { underline: true })
         .moveDown(0.5);

      const findings = generateKeyFindings(stats, functionStats);
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#374151');

      findings.forEach((finding, index) => {
        doc.text(`${index + 1}. ${finding}`, { indent: 20 })
           .moveDown(0.5);
      });

      // ===============================
      // 3. DETAILED ASSESSMENT RESULTS
      // ===============================
      doc.addPage();
      addPageHeader('Detailed Results');

      doc.fontSize(20)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('Detailed Assessment Results', 50, 80)
         .moveDown(2);

      // Group controls by function and category
      const groupedControls = groupControlsByFunctionAndCategory(controlAssessments);

      Object.entries(groupedControls).forEach(([funcCode, categories]) => {
        // Function header
        doc.fontSize(16)
           .fillColor('#1e40af')
           .font('Helvetica-Bold')
           .text(`${NIST_FUNCTIONS[funcCode]} (${funcCode})`, { underline: true })
           .moveDown(1);

        Object.entries(categories).forEach(([category, controls]) => {
          // Check if we need a new page
          if (doc.y > 650) {
            doc.addPage();
            addPageHeader('Detailed Results');
            doc.y = 80;
          }

          // Category header
          doc.fontSize(13)
             .fillColor('#2563eb')
             .font('Helvetica-Bold')
             .text(category)
             .moveDown(0.5);

          controls.forEach((control) => {
            // Check if we need a new page for control
            if (doc.y > 650) {
              doc.addPage();
              addPageHeader('Detailed Results');
              doc.y = 80;
            }

            const controlY = doc.y;
            
            // Status indicator circle
            doc.circle(55, controlY + 6, 4)
               .fillAndStroke(STATUS_COLORS[control.assessment_status] || STATUS_COLORS.not_started, '#374151');

            // Control subcategory ID
            doc.fontSize(10)
               .fillColor('#6b7280')
               .font('Helvetica-Bold')
               .text(control.subcategory_id, 70, controlY);

            // Control name
            doc.fontSize(10)
               .fillColor('#374151')
               .font('Helvetica')
               .text(control.subcategory_name, 140, controlY, { width: 280 });

            // Status badge
            const statusText = control.assessment_status?.toUpperCase().replace('_', ' ') || 'NOT STARTED';
            const statusX = 430;
            const statusWidth = 130;
            
            doc.roundedRect(statusX, controlY - 2, statusWidth, 18, 3)
               .fillAndStroke(STATUS_COLORS[control.assessment_status] || STATUS_COLORS.not_started, '#374151');

            doc.fontSize(8)
               .fillColor('#ffffff')
               .font('Helvetica-Bold')
               .text(statusText, statusX, controlY + 2, {
                 width: statusWidth,
                 align: 'center'
               });

            let detailY = controlY + 22;

            // Comments if present
            if (control.comments && control.comments.trim() !== '') {
              doc.fontSize(9)
                 .fillColor('#6b7280')
                 .font('Helvetica-Oblique')
                 .text(`Comments: ${control.comments}`, 70, detailY, { width: 490 });
              detailY = doc.y + 5;
            }

            // Evidence count
            const evidenceCount = control.evidence_count || 0;
            if (evidenceCount > 0) {
              doc.fontSize(9)
                 .fillColor('#059669')
                 .font('Helvetica')
                 .text(`📎 ${evidenceCount} evidence file${evidenceCount > 1 ? 's' : ''} attached`, 70, detailY);
              detailY = doc.y + 5;
            }

            doc.y = detailY + 5;
          });

          doc.moveDown(1);
        });

        doc.moveDown(1);
      });

      // ===============================
      // 4. EVIDENCE SUMMARY
      // ===============================
      doc.addPage();
      addPageHeader('Evidence Summary');

      doc.fontSize(20)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('Evidence Summary', 50, 80)
         .moveDown(2);

      const evidenceSummary = generateEvidenceSummary(controlAssessments);

      if (evidenceSummary.totalFiles === 0) {
        doc.fontSize(11)
           .fillColor('#6b7280')
           .font('Helvetica-Oblique')
           .text('No evidence files have been attached to this assessment.');
      } else {
        doc.fontSize(11)
           .fillColor('#374151')
           .font('Helvetica')
           .text(`Total Evidence Files: ${evidenceSummary.totalFiles}`)
           .text(`Controls with Evidence: ${evidenceSummary.controlsWithEvidence}`)
           .moveDown(1);

        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('Evidence by Control', { underline: true })
           .moveDown(0.5);

        evidenceSummary.byControl.forEach((item) => {
          if (doc.y > 680) {
            doc.addPage();
            addPageHeader('Evidence Summary');
            doc.y = 80;
          }

          doc.fontSize(10)
             .fillColor('#2563eb')
             .font('Helvetica-Bold')
             .text(`${item.subcategory_id} - ${item.subcategory_name}`, 50)
             .fontSize(9)
             .fillColor('#374151')
             .font('Helvetica')
             .text(`${item.evidence_count} file${item.evidence_count > 1 ? 's' : ''}`, 70)
             .moveDown(0.5);
        });
      }

      // ===============================
      // 5. RECOMMENDATIONS
      // ===============================
      doc.addPage();
      addPageHeader('Recommendations');

      doc.fontSize(20)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('Recommendations', 50, 80)
         .moveDown(2);

      const recommendations = generateRecommendations(controlAssessments, stats);

      if (recommendations.length === 0) {
        doc.fontSize(11)
           .fillColor('#059669')
           .font('Helvetica-Bold')
           .text('Congratulations! All controls are complete. No recommendations at this time.');
      } else {
        doc.fontSize(11)
           .fillColor('#374151')
           .font('Helvetica')
           .text('Based on the assessment results, the following actions are recommended:')
           .moveDown(1);

        recommendations.forEach((rec, index) => {
          if (doc.y > 650) {
            doc.addPage();
            addPageHeader('Recommendations');
            doc.y = 80;
          }

          // Priority indicator
          const priorityColor = rec.priority === 'High' ? '#ef4444' : 
                               rec.priority === 'Medium' ? '#f59e0b' : '#10b981';
          
          doc.fontSize(11)
             .fillColor(priorityColor)
             .font('Helvetica-Bold')
             .text(`${index + 1}. [${rec.priority} Priority] `, { continued: true })
             .fillColor('#374151')
             .font('Helvetica')
             .text(rec.title)
             .fontSize(10)
             .fillColor('#6b7280')
             .text(rec.description, { indent: 20 })
             .moveDown(1);
        });
      }

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('Error generating compliance PDF:', error);
      reject(error);
    }
  });
};

/**
 * Calculate overall compliance statistics
 */
function calculateComplianceStats(controlAssessments) {
  const total = controlAssessments.length;
  const complete = controlAssessments.filter(c => c.assessment_status === 'complete').length;
  const inProgress = controlAssessments.filter(c => c.assessment_status === 'in_progress').length;
  const notStarted = controlAssessments.filter(c => c.assessment_status === 'not_started').length;
  const notApplicable = controlAssessments.filter(c => c.assessment_status === 'not_applicable').length;

  // Calculate score based on complete + half credit for in_progress, excluding not_applicable
  const applicableTotal = total - notApplicable;
  const weightedComplete = complete + (inProgress * 0.5);
  const overallScore = applicableTotal > 0 ? Math.round((weightedComplete / applicableTotal) * 100) : 0;

  return {
    totalControls: total,
    complete,
    inProgress,
    notStarted,
    notApplicable,
    overallScore
  };
}

/**
 * Calculate compliance by NIST CSF function
 */
function calculateFunctionStats(controlAssessments) {
  const stats = {};

  Object.keys(NIST_FUNCTIONS).forEach(funcCode => {
    const functionControls = controlAssessments.filter(c => 
      c.subcategory_id.startsWith(funcCode)
    );

    const total = functionControls.length;
    const complete = functionControls.filter(c => c.assessment_status === 'complete').length;
    const inProgress = functionControls.filter(c => c.assessment_status === 'in_progress').length;
    const notApplicable = functionControls.filter(c => c.assessment_status === 'not_applicable').length;

    const applicableTotal = total - notApplicable;
    const weightedComplete = complete + (inProgress * 0.5);
    const score = applicableTotal > 0 ? Math.round((weightedComplete / applicableTotal) * 100) : 0;

    stats[funcCode] = {
      total,
      complete,
      inProgress,
      notApplicable,
      score
    };
  });

  return stats;
}

/**
 * Group controls by function and category
 */
function groupControlsByFunctionAndCategory(controlAssessments) {
  const grouped = {};

  controlAssessments.forEach(control => {
    const funcCode = control.subcategory_id.substring(0, 2);
    const category = control.category_name;

    if (!grouped[funcCode]) {
      grouped[funcCode] = {};
    }

    if (!grouped[funcCode][category]) {
      grouped[funcCode][category] = [];
    }

    grouped[funcCode][category].push(control);
  });

  return grouped;
}

/**
 * Generate key findings based on statistics
 */
function generateKeyFindings(stats, functionStats) {
  const findings = [];

  // Overall compliance finding
  if (stats.overallScore >= 80) {
    findings.push(`Strong overall compliance at ${stats.overallScore}%, demonstrating mature cybersecurity practices.`);
  } else if (stats.overallScore >= 50) {
    findings.push(`Moderate compliance at ${stats.overallScore}%, with significant room for improvement in cybersecurity posture.`);
  } else {
    findings.push(`Low compliance at ${stats.overallScore}%, indicating critical gaps in cybersecurity controls that require immediate attention.`);
  }

  // Find weakest function
  const weakestFunc = Object.entries(functionStats).sort((a, b) => a[1].score - b[1].score)[0];
  if (weakestFunc && weakestFunc[1].score < 70) {
    findings.push(`The ${NIST_FUNCTIONS[weakestFunc[0]]} function shows the lowest compliance at ${weakestFunc[1].score}%, representing a priority area for improvement.`);
  }

  // Find strongest function
  const strongestFunc = Object.entries(functionStats).sort((a, b) => b[1].score - a[1].score)[0];
  if (strongestFunc && strongestFunc[1].score >= 80) {
    findings.push(`The ${NIST_FUNCTIONS[strongestFunc[0]]} function demonstrates strong compliance at ${strongestFunc[1].score}%, serving as a model for other areas.`);
  }

  // In progress finding
  if (stats.inProgress > 0) {
    findings.push(`${stats.inProgress} controls are currently in progress, showing active effort toward improving compliance.`);
  }

  // Not started finding
  if (stats.notStarted > stats.totalControls * 0.3) {
    findings.push(`${stats.notStarted} controls have not been started (${Math.round(stats.notStarted / stats.totalControls * 100)}% of total), requiring immediate action planning.`);
  }

  return findings;
}

/**
 * Generate evidence summary
 */
function generateEvidenceSummary(controlAssessments) {
  const controlsWithEvidence = controlAssessments.filter(c => 
    c.evidence_count && c.evidence_count > 0
  );

  const totalFiles = controlsWithEvidence.reduce((sum, c) => 
    sum + (c.evidence_count || 0), 0
  );

  return {
    totalFiles,
    controlsWithEvidence: controlsWithEvidence.length,
    byControl: controlsWithEvidence.map(c => ({
      subcategory_id: c.subcategory_id,
      subcategory_name: c.subcategory_name,
      evidence_count: c.evidence_count
    }))
  };
}

/**
 * Generate recommendations for incomplete controls
 */
function generateRecommendations(controlAssessments, stats) {
  const recommendations = [];

  // High priority: Not started controls in critical functions
  const criticalNotStarted = controlAssessments.filter(c => 
    c.assessment_status === 'not_started' && 
    (c.subcategory_id.startsWith('PR') || c.subcategory_id.startsWith('DE'))
  );

  if (criticalNotStarted.length > 0) {
    recommendations.push({
      priority: 'High',
      title: 'Implement Critical Protection and Detection Controls',
      description: `${criticalNotStarted.length} critical controls in the Protect and Detect functions have not been started. These are essential for preventing and identifying security incidents.`
    });
  }

  // Medium priority: In progress controls
  if (stats.inProgress > 5) {
    recommendations.push({
      priority: 'Medium',
      title: 'Complete In-Progress Controls',
      description: `Focus on completing the ${stats.inProgress} controls currently in progress to improve overall compliance score.`
    });
  }

  // Controls without evidence
  const noEvidence = controlAssessments.filter(c => 
    c.assessment_status === 'complete' && 
    (!c.evidence_count || c.evidence_count === 0)
  );

  if (noEvidence.length > 0) {
    recommendations.push({
      priority: 'Medium',
      title: 'Document Evidence for Completed Controls',
      description: `${noEvidence.length} controls are marked complete but lack supporting evidence. Upload documentation to strengthen audit readiness.`
    });
  }

  // Low priority: Not started controls in other functions
  const otherNotStarted = controlAssessments.filter(c => 
    c.assessment_status === 'not_started' && 
    !c.subcategory_id.startsWith('PR') && 
    !c.subcategory_id.startsWith('DE')
  );

  if (otherNotStarted.length > 0) {
    recommendations.push({
      priority: 'Low',
      title: 'Begin Assessment of Remaining Controls',
      description: `${otherNotStarted.length} controls in the Identify, Respond, and Recover functions require assessment to achieve comprehensive coverage.`
    });
  }

  return recommendations;
}

/**
 * Get color based on compliance score
 */
function getScoreColor(score) {
  if (score >= 80) return '#10b981'; // Green
  if (score >= 60) return '#f59e0b'; // Yellow/Amber
  if (score >= 40) return '#fb923c'; // Orange
  return '#ef4444'; // Red
}

module.exports = {
  generateCompliancePDF
};
