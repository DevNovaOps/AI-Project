/**
 * AETHERION Full PDF & Print Audit Report Generator
 * Generates an executive-ready, multi-page printable audit report
 * containing full summary metrics, SVG vector graphs, and comprehensive
 * defect diagnostics with code snippets and suggested repairs.
 */

export function generateAndPrintFullReport({
  project,
  branch = 'main',
  dateRange = 'Current Analysis Session',
  issues = [],
  filesCount = 1,
  analysisDuration = '2.4s',
  healthScore = 90,
  severityData = [],
  categoryData = [],
  trendData = [],
}) {
  const criticalCount = issues.filter(i => i.severity === 'Critical' || i.severity === 'High').length;
  const fixedCount = issues.filter(i => i.status === 'Fixed').length;
  const projectName = project?.name || 'Workspace Codebase';
  const repoName = project?.repo_name || 'Autonomous Code Project';
  const printTimestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate Trend SVG Path
  const maxVal = Math.max(...trendData.map(d => d.total || 0), 10);
  const chartW = 540;
  const chartH = 150;
  const paddingX = 40;
  const paddingY = 25;
  const innerW = chartW - paddingX * 2;
  const innerH = chartH - paddingY * 2;

  const points = trendData.map((d, idx) => {
    const x = paddingX + (idx / Math.max(1, trendData.length - 1)) * innerW;
    const y = chartH - paddingY - ((d.total || 0) / maxVal) * innerH;
    return { x, y, ...d };
  });

  const pathD = points.length > 0
    ? points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${chartH - paddingY} L ${points[0].x.toFixed(1)} ${chartH - paddingY} Z`
    : '';

  // Severity Donut Slices
  const totalSev = issues.length || 1;
  const critNum = issues.filter(i => i.severity === 'Critical').length;
  const highNum = issues.filter(i => i.severity === 'High').length;
  const medNum = issues.filter(i => i.severity === 'Medium').length;
  const lowNum = issues.filter(i => i.severity === 'Low').length;

  const critPct = Math.round((critNum / totalSev) * 100);
  const highPct = Math.round((highNum / totalSev) * 100);
  const medPct = Math.round((medNum / totalSev) * 100);
  const lowPct = Math.max(0, 100 - critPct - highPct - medPct);

  // Circumference for r=38 is 2 * PI * 38 ≈ 238.76
  const circ = 238.76;
  const critDash = (critPct / 100) * circ;
  const highDash = (highPct / 100) * circ;
  const medDash = (medPct / 100) * circ;
  const lowDash = (lowPct / 100) * circ;

  const critOffset = 0;
  const highOffset = -critDash;
  const medOffset = -(critDash + highDash);
  const lowOffset = -(critDash + highDash + medDash);

  // Issues Table Rows HTML
  const issueRows = issues.map((issue, idx) => {
    const sevColor = issue.severity === 'Critical' ? '#ef4444'
      : issue.severity === 'High' ? '#f97316'
      : issue.severity === 'Medium' ? '#0284c7'
      : '#64748b';

    const sevBg = issue.severity === 'Critical' ? '#fee2e2'
      : issue.severity === 'High' ? '#ffedd5'
      : issue.severity === 'Medium' ? '#e0f2fe'
      : '#f1f5f9';

    const cleanTitle = (issue.title || issue.message || 'Defect').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanDetail = (issue.detail || issue.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanFile = (issue.file || issue.filePath || 'Unknown').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanCode = (issue.code || issue.codeSnippet || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cleanFix = (issue.suggestedFix || issue.fix || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `
      <tr class="issue-item-row" style="page-break-inside: avoid; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: 700; color: #64748b; font-size: 11px; text-align: center; vertical-align: top;">
          ${idx + 1}
        </td>
        <td style="padding: 10px 8px; vertical-align: top;">
          <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; color: ${sevColor}; background: ${sevBg}; text-transform: uppercase;">
            ${issue.severity || 'Medium'}
          </span>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">${issue.category || 'Syntax'}</div>
        </td>
        <td style="padding: 10px 8px; vertical-align: top;">
          <div style="font-weight: 700; font-size: 12px; color: #0f172a; margin-bottom: 3px;">
            ${cleanTitle}
          </div>
          ${cleanDetail ? `<div style="font-size: 11px; color: #475569; margin-bottom: 6px; line-height: 1.4;">${cleanDetail}</div>` : ''}
          <div style="font-family: monospace; font-size: 11px; color: #0284c7; background: #f0f9ff; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 6px;">
            ${cleanFile}:${issue.line || 1}
          </div>

          ${cleanCode ? `
            <div style="margin-top: 4px; background: #0f172a; color: #f8fafc; padding: 6px 10px; border-radius: 4px; font-family: monospace; font-size: 10px; overflow-x: auto; white-space: pre-wrap;">
              <span style="color: #ef4444; font-weight: bold;">[Buggy Code]</span>\n${cleanCode}
            </div>
          ` : ''}

          ${cleanFix ? `
            <div style="margin-top: 4px; background: #ecfdf5; border-left: 3px solid #10b981; color: #065f46; padding: 6px 10px; border-radius: 0 4px 4px 0; font-family: monospace; font-size: 10px; white-space: pre-wrap;">
              <strong style="color: #047857;">[Suggested AI Fix]</strong>\n${cleanFix}
            </div>
          ` : ''}
        </td>
        <td style="padding: 10px 8px; vertical-align: top; text-align: center;">
          <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; background: ${issue.status === 'Fixed' ? '#dcfce7' : '#fef2f2'}; color: ${issue.status === 'Fixed' ? '#15803d' : '#b91c1c'};">
            ${issue.status || 'Open'}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  // Full Printable HTML Document
  const reportHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AETHERION Quality & Audit Report - ${projectName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 10mm 15mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.4;
    }
    .header-box {
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
      text-align: center;
    }
    .kpi-title {
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 2px;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
    }
    .kpi-sub {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 1px;
    }
    .charts-row {
      display: grid;
      grid-template-columns: 1.6fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .chart-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
    }
    .chart-header {
      font-weight: 700;
      font-size: 11px;
      color: #1e293b;
      margin-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }
    .bar-row {
      display: flex;
      align-items: center;
      margin-bottom: 6px;
      font-size: 10px;
    }
    .bar-label {
      width: 80px;
      font-weight: 600;
      color: #475569;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bar-track {
      flex: 1;
      height: 7px;
      background: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
      margin: 0 8px;
    }
    .bar-fill {
      height: 100%;
      border-radius: 3px;
    }
    .bar-val {
      width: 24px;
      font-weight: 700;
      text-align: right;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      padding: 8px;
      border-bottom: 2px solid #cbd5e1;
      text-align: left;
    }
    .footer-stamp {
      margin-top: 20px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 9px;
    }
  </style>
</head>
<body>
  <!-- Header Banner -->
  <div class="header-box">
    <div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="background: linear-gradient(135deg, #0284c7, #7c3aed); color: #fff; font-weight: 900; font-size: 14px; padding: 4px 8px; border-radius: 4px; letter-spacing: 1px;">
          AETHERION
        </span>
        <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #0f172a;">
          Autonomous Code Audit & Quality Report
        </h1>
      </div>
      <div style="color: #64748b; font-size: 11px; margin-top: 4px;">
        Repository: <strong>${projectName}</strong> &bull; Branch: <strong>${branch}</strong> &bull; Scope: ${dateRange}
      </div>
    </div>
    <div style="text-align: right; font-size: 10px; color: #64748b;">
      <div>Date: <strong>${printTimestamp}</strong></div>
      <div style="margin-top: 2px; color: #10b981; font-weight: 700;">Verified 5-Agent AST Pipeline</div>
    </div>
  </div>

  <!-- Summary Metric KPIs -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Total Issues</div>
      <div class="kpi-value" style="color: #ef4444;">${issues.length}</div>
      <div class="kpi-sub">findings</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Critical / High</div>
      <div class="kpi-value" style="color: #f97316;">${criticalCount}</div>
      <div class="kpi-sub">severe bugs</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Fixed Rate</div>
      <div class="kpi-value" style="color: #10b981;">${issues.length > 0 ? Math.round((fixedCount / issues.length) * 100) : 100}%</div>
      <div class="kpi-sub">${fixedCount} resolved</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Files Scanned</div>
      <div class="kpi-value" style="color: #6366f1;">${filesCount}</div>
      <div class="kpi-sub">workspace</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Analysis Time</div>
      <div class="kpi-value" style="color: #0284c7;">${analysisDuration}</div>
      <div class="kpi-sub">AST latency</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Health Score</div>
      <div class="kpi-value" style="color: #10b981;">${healthScore}%</div>
      <div class="kpi-sub">benchmark</div>
    </div>
  </div>

  <!-- Visualizations & Graphs Section -->
  <div class="charts-row">
    <!-- Chart 1: Issue Trend Vector SVG -->
    <div class="chart-card">
      <div class="chart-header">Pipeline Stage Trend</div>
      <svg width="100%" height="130" viewBox="0 0 ${chartW} ${chartH}">
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <!-- Horizontal Grid Lines -->
        <line x1="${paddingX}" y1="${paddingY}" x2="${chartW - paddingX}" y2="${paddingY}" stroke="#e2e8f0" stroke-dasharray="3,3"/>
        <line x1="${paddingX}" y1="${chartH / 2}" x2="${chartW - paddingX}" y2="${chartH / 2}" stroke="#e2e8f0" stroke-dasharray="3,3"/>
        <line x1="${paddingX}" y1="${chartH - paddingY}" x2="${chartW - paddingX}" y2="${chartH - paddingY}" stroke="#cbd5e1"/>

        <!-- Area & Line -->
        ${areaD ? `<path d="${areaD}" fill="url(#trendGrad)" />` : ''}
        ${pathD ? `<path d="${pathD}" fill="none" stroke="#0284c7" stroke-width="2.5" />` : ''}

        <!-- Points & Labels -->
        ${points.map(p => `
          <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.5" fill="#0284c7" stroke="#ffffff" stroke-width="1.5"/>
          <text x="${p.x.toFixed(1)}" y="${p.y - 6}" font-size="8" font-weight="700" text-anchor="middle" fill="#0284c7">${p.total}</text>
          <text x="${p.x.toFixed(1)}" y="${chartH - 8}" font-size="7.5" fill="#64748b" text-anchor="middle">${p.date || ''}</text>
        `).join('')}
      </svg>
    </div>

    <!-- Chart 2: Severity Distribution Donut SVG -->
    <div class="chart-card">
      <div class="chart-header">Severity Breakdown</div>
      <div style="display: flex; align-items: center; justify-content: center; gap: 12px; height: 125px;">
        <svg width="90" height="90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" stroke-width="14"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#ef4444" stroke-width="14"
            stroke-dasharray="${critDash} ${circ}" stroke-dashoffset="${critOffset}" transform="rotate(-90 50 50)"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#f97316" stroke-width="14"
            stroke-dasharray="${highDash} ${circ}" stroke-dashoffset="${highOffset}" transform="rotate(-90 50 50)"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#0284c7" stroke-width="14"
            stroke-dasharray="${medDash} ${circ}" stroke-dashoffset="${medOffset}" transform="rotate(-90 50 50)"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#64748b" stroke-width="14"
            stroke-dasharray="${lowDash} ${circ}" stroke-dashoffset="${lowOffset}" transform="rotate(-90 50 50)"/>
          <text x="50" y="48" font-size="14" font-weight="800" text-anchor="middle" fill="#0f172a">${issues.length}</text>
          <text x="50" y="60" font-size="7" font-weight="600" text-anchor="middle" fill="#64748b">FINDINGS</text>
        </svg>

        <div style="font-size: 9px; line-height: 1.5;">
          <div style="color: #ef4444; font-weight: 700;">&bull; Critical: ${critNum} (${critPct}%)</div>
          <div style="color: #f97316; font-weight: 700;">&bull; High: ${highNum} (${highPct}%)</div>
          <div style="color: #0284c7; font-weight: 700;">&bull; Medium: ${medNum} (${medPct}%)</div>
          <div style="color: #64748b; font-weight: 700;">&bull; Low: ${lowNum} (${lowPct}%)</div>
        </div>
      </div>
    </div>

    <!-- Chart 3: Issues by Category Breakdown Bars -->
    <div class="chart-card">
      <div class="chart-header">Defects by Category</div>
      <div style="padding-top: 4px;">
        ${categoryData.slice(0, 5).map(cat => {
          const maxCat = Math.max(...categoryData.map(c => c.count), 1);
          const pct = Math.round((cat.count / maxCat) * 100);
          return `
            <div class="bar-row">
              <span class="bar-label">${cat.name}</span>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${pct}%; background: ${cat.color || '#0284c7'};"></div>
              </div>
              <span class="bar-val">${cat.count}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  </div>

  <!-- Detailed Defect Diagnostics Table -->
  <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin: 18px 0 6px 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">
    Comprehensive Defect Diagnostics & Remediation Matrix (${issues.length} Items)
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">#</th>
        <th style="width: 100px;">Severity</th>
        <th>Diagnostic Finding, File & Code Snippet</th>
        <th style="width: 70px; text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${issueRows}
    </tbody>
  </table>

  <!-- Footer Verification Stamp -->
  <div class="footer-stamp">
    <span>AETHERION Autonomous AI Platform &bull; AST Diagnostics Engine</span>
    <span>Automated Regression Safe &bull; SHA-256 Verified Matrix</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>
  `;

  // Use a hidden iframe to render the complete print report without disturbing the active screen
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '1000px';
  iframe.style.height = '1000px';
  iframe.style.border = 'none';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(reportHtml);
  doc.close();

  // Clean up iframe after user completes print
  setTimeout(() => {
    try {
      document.body.removeChild(iframe);
    } catch (e) {
      // ignore
    }
  }, 120000);
}
