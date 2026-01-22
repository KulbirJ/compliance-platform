const PDFDocument = require('pdfkit');

/**
 * Threat Report Generator
 * Generates professional PDF reports for STRIDE threat model analysis
 */

// STRIDE Categories
const STRIDE_CATEGORIES = {
  'S': { name: 'Spoofing', color: '#ef4444' },
  'T': { name: 'Tampering', color: '#f97316' },
  'R': { name: 'Repudiation', color: '#f59e0b' },
  'I': { name: 'Information Disclosure', color: '#8b5cf6' },
  'D': { name: 'Denial of Service', color: '#3b82f6' },
  'E': { name: 'Elevation of Privilege', color: '#ec4899' }
};

// Risk level definitions
const RISK_LEVELS = {
  critical: { label: 'Critical', color: '#7f1d1d', range: [20, 25] },
  high: { label: 'High', color: '#ef4444', range: [12, 19] },
  medium: { label: 'Medium', color: '#f59e0b', range: [6, 11] },
  low: { label: 'Low', color: '#10b981', range: [1, 5] }
};

// Likelihood/Impact mappings
const SEVERITY_VALUES = {
  very_low: 1,
  low: 2,
  medium: 3,
  high: 4,
  very_high: 5
};

const SEVERITY_LABELS = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Very High'
};

/**
 * Generate a threat model analysis PDF report
 * @param {object} threatModelData - Threat model information
 * @param {array} assets - Array of assets
 * @param {array} threats - Array of threats with STRIDE categories
 * @param {array} mitigations - Array of mitigations
 * @param {string} organizationName - Name of the organization
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateThreatPDF = (threatModelData, assets, threats, mitigations, organizationName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'letter',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `STRIDE Threat Analysis Report - ${threatModelData.model_name}`,
          Author: organizationName,
          Subject: 'Threat Model Analysis Report'
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
           .strokeColor('#dc2626')
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
         .fillColor('#991b1b')
         .font('Helvetica-Bold')
         .text('STRIDE Threat Modeling', { align: 'center' })
         .moveDown(0.5);

      doc.fontSize(24)
         .fillColor('#dc2626')
         .text('Threat Analysis Report', { align: 'center' })
         .moveDown(3);

      // Threat model info box
      const boxY = doc.y;
      doc.rect(100, boxY, 412, 200)
         .fillAndStroke('#fef2f2', '#dc2626');

      doc.fontSize(14)
         .fillColor('#991b1b')
         .font('Helvetica-Bold')
         .text('Organization:', 120, boxY + 30)
         .font('Helvetica')
         .fillColor('#374151')
         .text(organizationName, 250, boxY + 30);

      doc.font('Helvetica-Bold')
         .fillColor('#991b1b')
         .text('Threat Model:', 120, boxY + 60)
         .font('Helvetica')
         .fillColor('#374151')
         .text(threatModelData.model_name, 250, boxY + 60);

      doc.font('Helvetica-Bold')
         .fillColor('#991b1b')
         .text('System:', 120, boxY + 90)
         .font('Helvetica')
         .fillColor('#374151')
         .text(threatModelData.system_name || 'N/A', 250, boxY + 90);

      doc.font('Helvetica-Bold')
         .fillColor('#991b1b')
         .text('Report Date:', 120, boxY + 120)
         .font('Helvetica')
         .fillColor('#374151')
         .text(new Date().toLocaleDateString('en-US', { 
           year: 'numeric', 
           month: 'long', 
           day: 'numeric' 
         }), 250, boxY + 120);

      doc.font('Helvetica-Bold')
         .fillColor('#991b1b')
         .text('Status:', 120, boxY + 150)
         .font('Helvetica')
         .fillColor('#374151')
         .text(threatModelData.status?.toUpperCase() || 'DRAFT', 250, boxY + 150);

      doc.font('Helvetica-Bold')
         .fillColor('#991b1b')
         .text('Risk Score:', 120, boxY + 180)
         .font('Helvetica-Bold')
         .fillColor(getRiskColor(threatModelData.risk_score || 0))
         .text(threatModelData.risk_score?.toFixed(1) || '0.0', 250, boxY + 180);

      // ===============================
      // 2. EXECUTIVE SUMMARY
      // ===============================
      doc.addPage();
      addPageHeader('Executive Summary');

      doc.fontSize(20)
         .fillColor('#991b1b')
         .font('Helvetica-Bold')
         .text('Executive Summary', 50, 80)
         .moveDown(2);

      // Calculate threat statistics
      const stats = calculateThreatStats(threats, mitigations);

      // Threat Overview Boxes
      const boxWidth = 120;
      const boxHeight = 70;
      const boxSpacing = 15;
      const startX = 50;
      let currentX = startX;
      const summaryY = doc.y;

      // Total Threats
      doc.rect(currentX, summaryY, boxWidth, boxHeight)
         .fillAndStroke('#dbeafe', '#3b82f6');
      
      doc.fontSize(28)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text(stats.total.toString(), currentX, summaryY + 15, {
           width: boxWidth,
           align: 'center'
         });
      
      doc.fontSize(10)
         .fillColor('#374151')
         .font('Helvetica')
         .text('Total Threats', currentX, summaryY + 50, {
           width: boxWidth,
           align: 'center'
         });

      currentX += boxWidth + boxSpacing;

      // Critical Threats
      doc.rect(currentX, summaryY, boxWidth, boxHeight)
         .fillAndStroke('#fee2e2', '#ef4444');
      
      doc.fontSize(28)
         .fillColor('#991b1b')
         .font('Helvetica-Bold')
         .text(stats.critical.toString(), currentX, summaryY + 15, {
           width: boxWidth,
           align: 'center'
         });
      
      doc.fontSize(10)
         .fillColor('#374151')
         .font('Helvetica')
         .text('Critical', currentX, summaryY + 50, {
           width: boxWidth,
           align: 'center'
         });

      currentX += boxWidth + boxSpacing;

      // High Risk Threats
      doc.rect(currentX, summaryY, boxWidth, boxHeight)
         .fillAndStroke('#fef3c7', '#f59e0b');
      
      doc.fontSize(28)
         .fillColor('#92400e')
         .font('Helvetica-Bold')
         .text(stats.high.toString(), currentX, summaryY + 15, {
           width: boxWidth,
           align: 'center'
         });
      
      doc.fontSize(10)
         .fillColor('#374151')
         .font('Helvetica')
         .text('High Risk', currentX, summaryY + 50, {
           width: boxWidth,
           align: 'center'
         });

      currentX += boxWidth + boxSpacing;

      // Mitigations
      doc.rect(currentX, summaryY, boxWidth, boxHeight)
         .fillAndStroke('#d1fae5', '#10b981');
      
      doc.fontSize(28)
         .fillColor('#065f46')
         .font('Helvetica-Bold')
         .text(stats.totalMitigations.toString(), currentX, summaryY + 15, {
           width: boxWidth,
           align: 'center'
         });
      
      doc.fontSize(10)
         .fillColor('#374151')
         .font('Helvetica')
         .text('Mitigations', currentX, summaryY + 50, {
           width: boxWidth,
           align: 'center'
         });

      doc.y = summaryY + boxHeight + 30;

      // Risk Distribution Chart
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Risk Distribution', { underline: true })
         .moveDown(1);

      const chartY = doc.y;
      const chartWidth = 500;
      const chartHeight = 30;

      const criticalWidth = (stats.critical / stats.total) * chartWidth;
      const highWidth = (stats.high / stats.total) * chartWidth;
      const mediumWidth = (stats.medium / stats.total) * chartWidth;
      const lowWidth = (stats.low / stats.total) * chartWidth;

      let chartX = 50;

      if (criticalWidth > 0) {
        doc.rect(chartX, chartY, criticalWidth, chartHeight)
           .fillAndStroke(RISK_LEVELS.critical.color, '#000000');
        doc.fontSize(9)
           .fillColor('#ffffff')
           .font('Helvetica-Bold')
           .text(`${stats.critical}`, chartX, chartY + 10, {
             width: criticalWidth,
             align: 'center'
           });
        chartX += criticalWidth;
      }

      if (highWidth > 0) {
        doc.rect(chartX, chartY, highWidth, chartHeight)
           .fillAndStroke(RISK_LEVELS.high.color, '#000000');
        doc.fontSize(9)
           .fillColor('#ffffff')
           .font('Helvetica-Bold')
           .text(`${stats.high}`, chartX, chartY + 10, {
             width: highWidth,
             align: 'center'
           });
        chartX += highWidth;
      }

      if (mediumWidth > 0) {
        doc.rect(chartX, chartY, mediumWidth, chartHeight)
           .fillAndStroke(RISK_LEVELS.medium.color, '#000000');
        doc.fontSize(9)
           .fillColor('#ffffff')
           .font('Helvetica-Bold')
           .text(`${stats.medium}`, chartX, chartY + 10, {
             width: mediumWidth,
             align: 'center'
           });
        chartX += mediumWidth;
      }

      if (lowWidth > 0) {
        doc.rect(chartX, chartY, lowWidth, chartHeight)
           .fillAndStroke(RISK_LEVELS.low.color, '#000000');
        doc.fontSize(9)
           .fillColor('#000000')
           .font('Helvetica-Bold')
           .text(`${stats.low}`, chartX, chartY + 10, {
             width: lowWidth,
             align: 'center'
           });
      }

      doc.y = chartY + chartHeight + 20;

      // Legend
      const legendY = doc.y;
      const legendBoxSize = 15;
      let legendX = 50;

      Object.entries(RISK_LEVELS).forEach(([key, level]) => {
        doc.rect(legendX, legendY, legendBoxSize, legendBoxSize)
           .fillAndStroke(level.color, '#000000');
        
        doc.fontSize(10)
           .fillColor('#374151')
           .font('Helvetica')
           .text(level.label, legendX + legendBoxSize + 5, legendY + 2);
        
        legendX += 130;
      });

      doc.y = legendY + 40;

      // Mitigation Status Overview
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Mitigation Status Overview', { underline: true })
         .moveDown(0.5);

      doc.fontSize(11)
         .font('Helvetica')
         .text(`Threats with Mitigations: ${stats.threatsWithMitigations} of ${stats.total}`)
         .text(`Implemented Mitigations: ${stats.implementedMitigations}`)
         .text(`In Progress: ${stats.inProgressMitigations}`)
         .text(`Proposed: ${stats.proposedMitigations}`)
         .text(`Mitigation Coverage: ${stats.mitigationCoverage}%`)
         .moveDown(1);

      // STRIDE Distribution
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#374151')
         .text('Threats by STRIDE Category', { underline: true })
         .moveDown(0.5);

      const strideStats = calculateStrideStats(threats);
      
      Object.entries(strideStats).forEach(([code, data]) => {
        const barY = doc.y;
        const barWidth = 350;
        const barHeight = 20;

        doc.fontSize(11)
           .fillColor('#374151')
           .font('Helvetica')
           .text(`${STRIDE_CATEGORIES[code].name} (${code})`, 50, barY);

        // Bar background
        doc.rect(200, barY, barWidth, barHeight)
           .fillAndStroke('#e5e7eb', '#9ca3af');

        // Bar fill
        if (data.count > 0) {
          const fillWidth = Math.min((data.count / stats.total) * barWidth, barWidth);
          doc.rect(200, barY, fillWidth, barHeight)
             .fillAndStroke(STRIDE_CATEGORIES[code].color, '#000000');
        }

        // Count label
        doc.fontSize(10)
           .fillColor('#ffffff')
           .font('Helvetica-Bold')
           .text(data.count.toString(), 200, barY + 5, {
             width: barWidth,
             align: 'center'
           });

        doc.moveDown(1.5);
      });

      // ===============================
      // 3. RISK MATRIX VISUALIZATION
      // ===============================
      doc.addPage();
      addPageHeader('Risk Matrix');

      doc.fontSize(20)
         .fillColor('#991b1b')
         .font('Helvetica-Bold')
         .text('Risk Matrix', 50, 80)
         .moveDown(2);

      drawRiskMatrix(doc, threats);

      // ===============================
      // 4. DETAILED THREAT ANALYSIS
      // ===============================
      doc.addPage();
      addPageHeader('Threat Analysis');

      doc.fontSize(20)
         .fillColor('#991b1b')
         .font('Helvetica-Bold')
         .text('Detailed Threat Analysis', 50, 80)
         .moveDown(2);

      // Group threats by STRIDE category
      const groupedThreats = groupThreatsByStride(threats, mitigations);

      Object.entries(groupedThreats).forEach(([code, categoryThreats]) => {
        if (categoryThreats.length === 0) return;

        // STRIDE Category header
        doc.fontSize(16)
           .fillColor(STRIDE_CATEGORIES[code].color)
           .font('Helvetica-Bold')
           .text(`${STRIDE_CATEGORIES[code].name} (${code})`, { underline: true })
           .moveDown(1);

        categoryThreats.forEach((threat) => {
          // Check if we need a new page
          if (doc.y > 600) {
            doc.addPage();
            addPageHeader('Threat Analysis');
            doc.y = 80;
          }

          const threatY = doc.y;
          
          // Threat title
          doc.fontSize(12)
             .fillColor('#374151')
             .font('Helvetica-Bold')
             .text(threat.threat_title);

          // Risk badge
          const riskLevel = getRiskLevel(threat.risk_score);
          const badgeX = 450;
          const badgeWidth = 110;
          
          doc.roundedRect(badgeX, threatY - 2, badgeWidth, 20, 3)
             .fillAndStroke(RISK_LEVELS[riskLevel].color, '#000000');

          doc.fontSize(9)
             .fillColor('#ffffff')
             .font('Helvetica-Bold')
             .text(`${RISK_LEVELS[riskLevel].label.toUpperCase()} (${threat.risk_score})`, badgeX, threatY + 3, {
             width: badgeWidth,
             align: 'center'
           });

          doc.moveDown(0.5);

          // Threat details
          doc.fontSize(10)
             .fillColor('#6b7280')
             .font('Helvetica')
             .text(`Asset: ${threat.asset_name}`, 70)
             .text(`Description: ${threat.threat_description || 'N/A'}`, 70)
             .fontSize(9)
             .text(`Likelihood: ${SEVERITY_LABELS[SEVERITY_VALUES[threat.likelihood]] || threat.likelihood}  |  ` +
                   `Impact: ${SEVERITY_LABELS[SEVERITY_VALUES[threat.impact]] || threat.impact}  |  ` +
                   `Status: ${formatStatus(threat.threat_status)}`, 70)
             .moveDown(0.5);

          // Mitigations for this threat
          if (threat.mitigations && threat.mitigations.length > 0) {
            doc.fontSize(10)
               .fillColor('#059669')
               .font('Helvetica-Bold')
               .text('Mitigations:', 70);

            threat.mitigations.forEach((mit, idx) => {
              doc.fontSize(9)
                 .fillColor('#374151')
                 .font('Helvetica')
                 .text(`${idx + 1}. [${formatStrategy(mit.mitigation_strategy)}] ${mit.mitigation_description}`, 85, doc.y, {
                   width: 475
                 })
                 .fontSize(8)
                 .fillColor('#6b7280')
                 .text(`   Status: ${formatStatus(mit.implementation_status)} | Priority: ${mit.priority?.toUpperCase()}`, 85)
                 .moveDown(0.3);
            });
          } else {
            doc.fontSize(9)
               .fillColor('#ef4444')
               .font('Helvetica-Oblique')
               .text('⚠ No mitigations defined', 70);
          }

          doc.moveDown(1);
          
          // Separator line
          doc.moveTo(50, doc.y)
             .lineTo(562, doc.y)
             .strokeColor('#e5e7eb')
             .stroke();
          
          doc.moveDown(1);
        });

        doc.moveDown(1);
      });

      // ===============================
      // 5. ASSET SUMMARY
      // ===============================
      doc.addPage();
      addPageHeader('Asset Summary');

      doc.fontSize(20)
         .fillColor('#991b1b')
         .font('Helvetica-Bold')
         .text('Asset Summary', 50, 80)
         .moveDown(2);

      const assetSummary = generateAssetSummary(assets, threats);

      doc.fontSize(11)
         .fillColor('#374151')
         .font('Helvetica')
         .text(`Total Assets: ${assetSummary.totalAssets}`)
         .text(`Assets with Threats: ${assetSummary.assetsWithThreats}`)
         .moveDown(1);

      // Asset table
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Assets and Threat Counts', { underline: true })
         .moveDown(0.5);

      assetSummary.assets.forEach((asset) => {
        if (doc.y > 680) {
          doc.addPage();
          addPageHeader('Asset Summary');
          doc.y = 80;
        }

        const assetY = doc.y;

        // Asset type icon and name
        doc.fontSize(11)
           .fillColor('#2563eb')
           .font('Helvetica-Bold')
           .text(`${asset.asset_name}`, 50, assetY);

        doc.fontSize(9)
           .fillColor('#6b7280')
           .font('Helvetica')
           .text(`Type: ${formatAssetType(asset.asset_type)} | Criticality: ${asset.criticality?.toUpperCase()}`, 50, assetY + 15);

        // Threat counts
        const countX = 400;
        doc.fontSize(10)
           .fillColor('#374151')
           .font('Helvetica-Bold')
           .text(`${asset.threat_count} threat${asset.threat_count !== 1 ? 's' : ''}`, countX, assetY);

        if (asset.high_risk_count > 0) {
          doc.fontSize(9)
             .fillColor('#ef4444')
             .text(`${asset.high_risk_count} high-risk`, countX, assetY + 15);
        }

        doc.moveDown(2);
      });

      // ===============================
      // 6. RECOMMENDATIONS
      // ===============================
      doc.addPage();
      addPageHeader('Recommendations');

      doc.fontSize(20)
         .fillColor('#991b1b')
         .font('Helvetica-Bold')
         .text('Recommendations', 50, 80)
         .moveDown(2);

      const recommendations = generateRecommendations(threats, stats);

      if (recommendations.length === 0) {
        doc.fontSize(11)
           .fillColor('#059669')
           .font('Helvetica-Bold')
           .text('All threats have been adequately addressed with mitigations.');
      } else {
        doc.fontSize(11)
           .fillColor('#374151')
           .font('Helvetica')
           .text('Based on the threat analysis, the following actions are recommended:')
           .moveDown(1);

        recommendations.forEach((rec, index) => {
          if (doc.y > 620) {
            doc.addPage();
            addPageHeader('Recommendations');
            doc.y = 80;
          }

          // Priority indicator
          const priorityColor = rec.priority === 'Critical' ? '#7f1d1d' :
                               rec.priority === 'High' ? '#ef4444' : 
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
             .moveDown(0.8);
        });
      }

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('Error generating threat PDF:', error);
      reject(error);
    }
  });
};

/**
 * Draw 5x5 risk matrix with threats plotted
 */
function drawRiskMatrix(doc, threats) {
  const matrixSize = 400;
  const cellSize = matrixSize / 5;
  const startX = 100;
  const startY = doc.y;

  // Draw grid
  for (let i = 0; i <= 5; i++) {
    // Horizontal lines
    doc.moveTo(startX, startY + (i * cellSize))
       .lineTo(startX + matrixSize, startY + (i * cellSize))
       .strokeColor('#9ca3af')
       .stroke();

    // Vertical lines
    doc.moveTo(startX + (i * cellSize), startY)
       .lineTo(startX + (i * cellSize), startY + matrixSize)
       .strokeColor('#9ca3af')
       .stroke();
  }

  // Color cells based on risk
  for (let impact = 5; impact >= 1; impact--) {
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      const riskScore = likelihood * impact;
      const riskLevel = getRiskLevel(riskScore);
      const cellColor = RISK_LEVELS[riskLevel].color;
      
      const x = startX + ((likelihood - 1) * cellSize);
      const y = startY + ((5 - impact) * cellSize);

      doc.rect(x + 1, y + 1, cellSize - 2, cellSize - 2)
         .fillOpacity(0.3)
         .fill(cellColor)
         .fillOpacity(1);

      // Risk score label
      doc.fontSize(10)
         .fillColor('#374151')
         .font('Helvetica')
         .text(riskScore.toString(), x, y + 5, {
           width: cellSize,
           align: 'center'
         });
    }
  }

  // Plot threats on matrix
  threats.forEach((threat) => {
    const likelihood = SEVERITY_VALUES[threat.likelihood] || 3;
    const impact = SEVERITY_VALUES[threat.impact] || 3;
    
    const x = startX + ((likelihood - 1) * cellSize) + (cellSize / 2);
    const y = startY + ((5 - impact) * cellSize) + (cellSize / 2);

    // Threat marker
    doc.circle(x, y, 6)
       .fillAndStroke('#000000', '#ffffff')
       .lineWidth(2);
  });

  // Axis labels
  doc.fontSize(12)
     .fillColor('#374151')
     .font('Helvetica-Bold')
     .text('Likelihood →', startX, startY + matrixSize + 15, {
       width: matrixSize,
       align: 'center'
     })
     .text('Impact', startX - 60, startY + (matrixSize / 2) - 10, {
       width: 50,
       align: 'center'
     });

  // Arrow for Impact
  doc.fontSize(16)
     .text('↑', startX - 25, startY + (matrixSize / 2) - 20);

  // Severity labels on axes
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#6b7280');

  const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
  
  // Likelihood labels (bottom)
  labels.forEach((label, idx) => {
    const x = startX + (idx * cellSize) + (cellSize / 2);
    doc.text(label, x - 25, startY + matrixSize + 30, {
      width: 50,
      align: 'center'
    });
  });

  // Impact labels (left)
  labels.reverse().forEach((label, idx) => {
    const y = startY + (idx * cellSize) + (cellSize / 2);
    doc.text(label, startX - 80, y - 5, {
      width: 70,
      align: 'right'
    });
  });

  doc.y = startY + matrixSize + 60;
}

/**
 * Calculate threat statistics
 */
function calculateThreatStats(threats, mitigations) {
  const total = threats.length;
  const critical = threats.filter(t => t.risk_score >= 20).length;
  const high = threats.filter(t => t.risk_score >= 12 && t.risk_score < 20).length;
  const medium = threats.filter(t => t.risk_score >= 6 && t.risk_score < 12).length;
  const low = threats.filter(t => t.risk_score < 6).length;

  const totalMitigations = mitigations.length;
  const implementedMitigations = mitigations.filter(m => 
    m.implementation_status === 'implemented' || m.implementation_status === 'verified'
  ).length;
  const inProgressMitigations = mitigations.filter(m => 
    m.implementation_status === 'in_progress'
  ).length;
  const proposedMitigations = mitigations.filter(m => 
    m.implementation_status === 'proposed' || m.implementation_status === 'approved'
  ).length;

  const threatIdsWithMitigations = new Set(mitigations.map(m => m.threat_id));
  const threatsWithMitigations = threats.filter(t => threatIdsWithMitigations.has(t.id)).length;
  const mitigationCoverage = total > 0 ? Math.round((threatsWithMitigations / total) * 100) : 0;

  return {
    total,
    critical,
    high,
    medium,
    low,
    totalMitigations,
    implementedMitigations,
    inProgressMitigations,
    proposedMitigations,
    threatsWithMitigations,
    mitigationCoverage
  };
}

/**
 * Calculate STRIDE category statistics
 */
function calculateStrideStats(threats) {
  const stats = {};
  
  Object.keys(STRIDE_CATEGORIES).forEach(code => {
    stats[code] = {
      count: threats.filter(t => t.stride_code === code).length
    };
  });

  return stats;
}

/**
 * Group threats by STRIDE category with their mitigations
 */
function groupThreatsByStride(threats, mitigations) {
  const grouped = {};

  Object.keys(STRIDE_CATEGORIES).forEach(code => {
    grouped[code] = [];
  });

  threats.forEach(threat => {
    const threatWithMitigations = {
      ...threat,
      mitigations: mitigations.filter(m => m.threat_id === threat.id)
    };
    
    const code = threat.stride_code || 'S';
    if (grouped[code]) {
      grouped[code].push(threatWithMitigations);
    }
  });

  // Sort threats within each category by risk score (descending)
  Object.keys(grouped).forEach(code => {
    grouped[code].sort((a, b) => b.risk_score - a.risk_score);
  });

  return grouped;
}

/**
 * Generate asset summary with threat counts
 */
function generateAssetSummary(assets, threats) {
  const assetThreatCounts = {};
  
  threats.forEach(threat => {
    const assetId = threat.asset_id;
    if (!assetThreatCounts[assetId]) {
      assetThreatCounts[assetId] = {
        total: 0,
        highRisk: 0
      };
    }
    assetThreatCounts[assetId].total++;
    if (threat.risk_score >= 12) {
      assetThreatCounts[assetId].highRisk++;
    }
  });

  const assetsWithCounts = assets.map(asset => ({
    ...asset,
    threat_count: assetThreatCounts[asset.id]?.total || 0,
    high_risk_count: assetThreatCounts[asset.id]?.highRisk || 0
  }));

  // Sort by threat count descending
  assetsWithCounts.sort((a, b) => b.threat_count - a.threat_count);

  return {
    totalAssets: assets.length,
    assetsWithThreats: assetsWithCounts.filter(a => a.threat_count > 0).length,
    assets: assetsWithCounts
  };
}

/**
 * Generate recommendations for high-risk threats
 */
function generateRecommendations(threats, stats) {
  const recommendations = [];

  // Critical threats without mitigations
  const criticalNoMit = threats.filter(t => 
    t.risk_score >= 20 && (!t.mitigations || t.mitigations.length === 0)
  );

  if (criticalNoMit.length > 0) {
    recommendations.push({
      priority: 'Critical',
      title: 'Address Critical Threats Immediately',
      description: `${criticalNoMit.length} critical threat${criticalNoMit.length > 1 ? 's' : ''} (risk score 20-25) have no mitigations defined. These pose severe risk and require immediate action.`
    });
  }

  // High-risk threats without implemented mitigations
  const highRiskNoImpl = threats.filter(t => 
    t.risk_score >= 12 && t.risk_score < 20 && 
    (!t.mitigations || !t.mitigations.some(m => 
      m.implementation_status === 'implemented' || m.implementation_status === 'verified'
    ))
  );

  if (highRiskNoImpl.length > 0) {
    recommendations.push({
      priority: 'High',
      title: 'Implement Mitigations for High-Risk Threats',
      description: `${highRiskNoImpl.length} high-risk threat${highRiskNoImpl.length > 1 ? 's' : ''} lack implemented mitigations. Prioritize implementing existing mitigation plans or creating new ones.`
    });
  }

  // Low mitigation coverage
  if (stats.mitigationCoverage < 50) {
    recommendations.push({
      priority: 'High',
      title: 'Increase Mitigation Coverage',
      description: `Only ${stats.mitigationCoverage}% of threats have mitigations defined. Develop mitigation strategies for unaddressed threats to improve security posture.`
    });
  }

  // Many proposed/approved but not in progress
  if (stats.proposedMitigations > stats.inProgressMitigations * 2) {
    recommendations.push({
      priority: 'Medium',
      title: 'Begin Implementation of Proposed Mitigations',
      description: `${stats.proposedMitigations} mitigations are proposed or approved but not yet in progress. Allocate resources to begin implementation.`
    });
  }

  // Threats in identified/analyzing status
  const notMitigating = threats.filter(t => 
    t.threat_status === 'identified' || t.threat_status === 'analyzing'
  );

  if (notMitigating.length > threats.length * 0.3) {
    recommendations.push({
      priority: 'Medium',
      title: 'Progress Threat Analysis',
      description: `${notMitigating.length} threats are still in early stages (identified/analyzing). Complete analysis and begin mitigation planning.`
    });
  }

  return recommendations;
}

/**
 * Get risk level from risk score
 */
function getRiskLevel(score) {
  if (score >= 20) return 'critical';
  if (score >= 12) return 'high';
  if (score >= 6) return 'medium';
  return 'low';
}

/**
 * Get color for risk score
 */
function getRiskColor(score) {
  const level = getRiskLevel(score);
  return RISK_LEVELS[level].color;
}

/**
 * Format status for display
 */
function formatStatus(status) {
  if (!status) return 'N/A';
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

/**
 * Format strategy for display
 */
function formatStrategy(strategy) {
  if (!strategy) return 'N/A';
  return strategy.charAt(0).toUpperCase() + strategy.slice(1);
}

/**
 * Format asset type for display
 */
function formatAssetType(type) {
  if (!type) return 'N/A';
  return type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

module.exports = {
  generateThreatPDF
};
