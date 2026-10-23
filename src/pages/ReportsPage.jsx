import React, { useState } from 'react';
import {
  FileText, Download, Calendar, GitBranch, ChevronDown,
  Printer, Check, Sparkles, X, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

import MetricCard from '../components/reports/MetricCard';
import IssueTrendChart from '../components/reports/IssueTrendChart';
import IssueDistributionChart from '../components/reports/IssueDistributionChart';
import CategoryBreakdown from '../components/reports/CategoryBreakdown';
import IssueTable from '../components/reports/IssueTable';
import IssueDetailsPanel from '../components/reports/IssueDetailsPanel';

import {
  summaryMetricsData,
  issueTrendsData,
  severityDistributionData,
  categoryBreakdownData,
  detailedIssuesList
} from '../data/reportData';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { appliedFixes, applyFix, undoFix, setRightSidebarTab } = useAppStore();

  // State management
  const [selectedIssueId, setSelectedIssueId] = useState('ISSUE-01');
  const [dateRange, setDateRange] = useState('Oct 1, 2024 - Oct 10, 2024');
  const [selectedBranch, setSelectedBranch] = useState('All Branches');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Issues list merged with appliedFixes store
  const issues = detailedIssuesList.map(item => ({
    ...item,
    status: appliedFixes.includes(item.id) ? 'Fixed' : item.status
  }));

  const selectedIssue = issues.find(i => i.id === selectedIssueId) || issues[0];
  const currentIndex = issues.findIndex(i => i.id === selectedIssue.id) + 1;
  const isSelectedFixed = appliedFixes.includes(selectedIssue.id) || selectedIssue.status === 'Fixed';

  // Navigation between issues
  const handlePrevIssue = () => {
    const idx = issues.findIndex(i => i.id === selectedIssue.id);
    if (idx > 0) {
      setSelectedIssueId(issues[idx - 1].id);
    } else {
      setSelectedIssueId(issues[issues.length - 1].id);
    }
  };

  const handleNextIssue = () => {
    const idx = issues.findIndex(i => i.id === selectedIssue.id);
    if (idx < issues.length - 1) {
      setSelectedIssueId(issues[idx + 1].id);
    } else {
      setSelectedIssueId(issues[0].id);
    }
  };

  // Actions
  const handleApplyFix = (issueId) => {
    if (appliedFixes.includes(issueId)) {
      undoFix(issueId);
      showToast(`Reverted fix for ${issueId}`);
    } else {
      applyFix(issueId);
      showToast(`Applied verified AI patch for ${issueId}`);
    }
  };

  const handleViewInEditor = (file, line) => {
    navigate('/');
  };

  const handleExplainIssue = (issue) => {
    setRightSidebarTab('chat');
    navigate('/');
  };

  const handleAddToTests = (issue) => {
    navigate('/tests');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generate Report Action
  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setReportModalOpen(true);
      showToast('Comprehensive report generated successfully!');
    }, 600);
  };

  // Working CSV Export
  const handleExportCSV = () => {
    const headers = ['#', 'Severity', 'Title', 'Detail', 'File', 'Line', 'Category', 'Status', 'Detected'];
    const rows = issues.map((i, idx) => [
      idx + 1,
      i.severity,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.detail.replace(/"/g, '""')}"`,
      i.file,
      i.line,
      i.category,
      i.status,
      i.detected
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AETHERION_Quality_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded CSV report!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: '#030b18',
        padding: '16px 22px 24px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        position: 'relative'
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 56,
          right: 24,
          backgroundColor: '#0c1830',
          border: '1px solid #1a66ff',
          boxShadow: '0 8px 24px rgba(0, 112, 243, 0.4)',
          borderRadius: 8,
          padding: '10px 16px',
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 600,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'popupFadeIn 0.2s ease-out'
        }}>
          <Sparkles size={14} color="#38bdf8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Left Title Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Document Icon Box with Purple Gradient */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 0 16px rgba(124, 58, 237, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <FileText size={22} />
          </div>

          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.3px', margin: 0 }}>
              Reports
            </h1>
            <p style={{ fontSize: 11, color: '#91a6c6', margin: '2px 0 0 0' }}>
              Analyze results, track progress and generate detailed reports for your code.
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Date Range Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setDateDropdownOpen(!dateDropdownOpen); setBranchDropdownOpen(false); }}
              style={{
                height: 32,
                padding: '0 12px',
                backgroundColor: '#0b1930',
                border: '1px solid #1a2a47',
                borderRadius: 6,
                color: '#f8fafc',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <span>{dateRange}</span>
              <ChevronDown size={12} color="#8fa2be" />
            </button>

            {dateDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                width: 190,
                backgroundColor: '#0c1830',
                border: '1px solid #1a2a47',
                borderRadius: 6,
                padding: 4,
                zIndex: 30,
                boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
              }}>
                {[
                  'Oct 1, 2024 - Oct 10, 2024',
                  'Last 7 Days',
                  'Last 30 Days',
                  'Month to Date',
                  'All Time'
                ].map((range) => (
                  <div
                    key={range}
                    onClick={() => { setDateRange(range); setDateDropdownOpen(false); }}
                    style={{
                      padding: '6px 10px',
                      fontSize: 11,
                      color: dateRange === range ? '#38bdf8' : '#f8fafc',
                      backgroundColor: dateRange === range ? '#132342' : 'transparent',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { if (dateRange !== range) e.target.style.backgroundColor = '#16284a'; }}
                    onMouseLeave={(e) => { if (dateRange !== range) e.target.style.backgroundColor = 'transparent'; }}
                  >
                    {range}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Branch Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setBranchDropdownOpen(!branchDropdownOpen); setDateDropdownOpen(false); }}
              style={{
                height: 32,
                padding: '0 12px',
                backgroundColor: '#0b1930',
                border: '1px solid #1a2a47',
                borderRadius: 6,
                color: '#f8fafc',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              <span>{selectedBranch}</span>
              <ChevronDown size={12} color="#8fa2be" />
            </button>

            {branchDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                width: 150,
                backgroundColor: '#0c1830',
                border: '1px solid #1a2a47',
                borderRadius: 6,
                padding: 4,
                zIndex: 30,
                boxShadow: '0 10px 25px rgba(0,0,0,0.8)'
              }}>
                {[
                  'All Branches',
                  'main',
                  'feature/auth-guard',
                  'staging',
                  'develop'
                ].map((branch) => (
                  <div
                    key={branch}
                    onClick={() => { setSelectedBranch(branch); setBranchDropdownOpen(false); }}
                    style={{
                      padding: '6px 10px',
                      fontSize: 11,
                      color: selectedBranch === branch ? '#38bdf8' : '#f8fafc',
                      backgroundColor: selectedBranch === branch ? '#132342' : 'transparent',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => { if (selectedBranch !== branch) e.target.style.backgroundColor = '#16284a'; }}
                    onMouseLeave={(e) => { if (selectedBranch !== branch) e.target.style.backgroundColor = 'transparent'; }}
                  >
                    {branch}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Generate Report Primary CTA Button */}
          <button
            className="btn btn-primary-gradient"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            style={{
              height: 32,
              padding: '0 14px',
              fontSize: 11,
              fontWeight: 600,
              gap: 6,
              borderRadius: 6
            }}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin" style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%' }} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Generate Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SUMMARY METRIC CARDS (6 HORIZONTALLY ALIGNED) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {summaryMetricsData.map((item) => (
          <MetricCard
            key={item.id}
            title={item.title}
            value={item.value}
            change={item.change}
            isPositive={item.isPositive}
            subtitle={item.subtitle}
            iconType={item.iconType}
            color={item.color}
            bg={item.bg}
            border={item.border}
          />
        ))}
      </div>

      {/* ANALYTICS ROW (3 PANELS: Issue Trend, Issue Distribution, Issues by Category) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.05fr 1.15fr', gap: 10, minHeight: 240 }}>
        {/* Panel A: Issue Trend */}
        <IssueTrendChart data={issueTrendsData} />

        {/* Panel B: Issue Distribution */}
        <IssueDistributionChart data={severityDistributionData} totalCount={24} />

        {/* Panel C: Issues by Category */}
        <CategoryBreakdown data={categoryBreakdownData} />
      </div>

      {/* SPLIT ROW: ISSUE MANAGEMENT TABLE (LEFT) + RIGHT-SIDE ISSUE DETAILS PANEL (RIGHT) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 385px', gap: 10, flex: 1, minHeight: 460 }}>
        {/* Left: Large Issue Management Table with Filter Toolbar */}
        <IssueTable
          issues={issues}
          selectedIssueId={selectedIssueId}
          onSelectIssue={(id) => setSelectedIssueId(id)}
          onViewInEditor={handleViewInEditor}
          onExplainIssue={handleExplainIssue}
        />

        {/* Right: Detailed Issue Information & Fix Panel */}
        <IssueDetailsPanel
          issue={selectedIssue}
          currentIndex={currentIndex}
          totalCount={issues.length}
          onPrev={handlePrevIssue}
          onNext={handleNextIssue}
          onApplyFix={handleApplyFix}
          onAddToTests={handleAddToTests}
          onExplain={handleExplainIssue}
          isFixed={isSelectedFixed}
        />
      </div>

      {/* GENERATE REPORT MODAL */}
      {reportModalOpen && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div
            className="palette-box"
            style={{ width: 620, padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} color="#38bdf8" />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>AETHERION Quality &amp; Audit Report</span>
              </div>
              <button className="editor-tab-close" onClick={() => setReportModalOpen(false)}>
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                <div style={{ padding: 10, backgroundColor: '#091326', borderRadius: 6, border: '1px solid #1a2a47' }}>
                  <div style={{ color: '#8fa2be', fontSize: 10 }}>Total Issues</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginTop: 2 }}>24</div>
                </div>
                <div style={{ padding: 10, backgroundColor: '#091326', borderRadius: 6, border: '1px solid #1a2a47' }}>
                  <div style={{ color: '#8fa2be', fontSize: 10 }}>Critical Issues</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', marginTop: 2 }}>4</div>
                </div>
                <div style={{ padding: 10, backgroundColor: '#091326', borderRadius: 6, border: '1px solid #1a2a47' }}>
                  <div style={{ color: '#8fa2be', fontSize: 10 }}>Fixed Rate</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981', marginTop: 2 }}>75%</div>
                </div>
              </div>

              <div style={{ color: '#91a6c6', lineHeight: 1.5 }}>
                Report generated for repository <strong>AegisVault</strong> on <strong>{selectedBranch}</strong> ({dateRange}). All 24 issues indexed across 32 files. Automated sandbox tests verified zero syntax or typing regressions.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 18px', borderTop: '1px solid var(--border-subtle)', backgroundColor: '#091326' }}>
              <button className="btn btn-secondary" onClick={handlePrint}>
                <Printer size={13} />
                <span>Print / PDF</span>
              </button>
              <button className="btn btn-primary-gradient" onClick={handleExportCSV}>
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
