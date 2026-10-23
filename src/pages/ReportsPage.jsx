import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend 
} from 'recharts';
import { 
  BarChart2, Download, Printer, Filter, Search, ShieldCheck, 
  AlertCircle, CheckCircle, Clock, FileCode, Sparkles, X, ChevronRight 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { 
  initialReportMetrics, issueTrendsData, severityDistributionData, 
  categoryBreakdownData, agentPerformanceData 
} from '../data/reportData';

export default function ReportsPage() {
  const { issues, appliedFixes, project, theme } = useAppStore();
  const [selectedIssueModal, setSelectedIssueModal] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const totalIssues = issues.length;
  const fixedCount = appliedFixes.length;
  const criticalCount = issues.filter(i => i.severity === 'Critical' && !appliedFixes.includes(i.id)).length;
  const codeQuality = fixedCount > 0 ? 94 : 86;

  // Filtered issues for the table
  const filteredIssues = issues.filter((iss) => {
    const isFixed = appliedFixes.includes(iss.id) || iss.status === 'Fixed';
    if (filterSeverity !== 'All' && iss.severity !== filterSeverity) return false;
    if (filterStatus === 'Open' && isFixed) return false;
    if (filterStatus === 'Fixed' && !isFixed) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!iss.title.toLowerCase().includes(q) && !iss.file.toLowerCase().includes(q) && !iss.detail.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Working CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'Severity', 'Title', 'Detail', 'File', 'Line', 'Source', 'Status'];
    const rows = issues.map(i => [
      i.id,
      i.severity,
      `"${i.title}"`,
      `"${i.detail}"`,
      i.file,
      i.line,
      i.source,
      appliedFixes.includes(i.id) ? 'Fixed' : 'Open'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AutonomusAI_Report_${project.name}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const chartThemeColors = {
    text: theme === 'dark' ? '#94a3b8' : '#64748b',
    grid: theme === 'dark' ? '#1e293b' : '#e2e8f0',
    tooltipBg: theme === 'dark' ? '#0f172a' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#334155' : '#cbd5e1'
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="logo-badge" style={{ width: 32, height: 32 }}>
              <BarChart2 size={18} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5 }}>
                Diagnostics &amp; Analytics Report
              </h1>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Multi-agent telemetry, issue resolution trends, and verification analytics for <strong style={{ color: 'var(--text-primary)' }}>{project.name}</strong> ({project.branch} branch)
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button 
            className="btn btn-secondary" 
            onClick={handlePrint}
            title="Print report or save to PDF"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>

          <button 
            className="btn btn-primary-gradient" 
            onClick={handleExportCSV}
            title="Export full issue log to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        <div className="card" style={{ padding: '14px', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Issues</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{totalIssues}</div>
          <div style={{ fontSize: 10, color: '#38bdf8' }}>Across 24 files</div>
        </div>

        <div className="card" style={{ padding: '14px', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Critical Bugs</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: criticalCount > 0 ? 'var(--color-critical)' : 'var(--color-success)' }}>
            {criticalCount}
          </div>
          <div style={{ fontSize: 10, color: criticalCount > 0 ? 'var(--color-critical)' : 'var(--color-success)' }}>
            {criticalCount > 0 ? 'Requires attention' : 'All resolved'}
          </div>
        </div>

        <div className="card" style={{ padding: '14px', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Fixed Issues</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)' }}>{fixedCount}</div>
          <div style={{ fontSize: 10, color: 'var(--color-success)' }}>{Math.round((fixedCount / totalIssues) * 100)}% resolution rate</div>
        </div>

        <div className="card" style={{ padding: '14px', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Files Scanned</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>24</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>3,420 AST nodes</div>
        </div>

        <div className="card" style={{ padding: '14px', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Analysis Time</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#a855f7' }}>2.1s</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>5 agents in pipeline</div>
        </div>

        <div className="card" style={{ padding: '14px', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Code Quality</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{codeQuality}/100</div>
          <div style={{ fontSize: 10, color: '#10b981' }}>Grade A (Certified)</div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Chart 1: Issue Trends Over Time */}
        <div className="card" style={{ padding: '16px', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Issue Resolution &amp; Quality Trend</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>7-day autonomous pipeline velocity</div>
            </div>
            <span className="badge badge-subtle">Daily</span>
          </div>

          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={issueTrendsData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFixed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartThemeColors.grid} />
                <XAxis dataKey="date" stroke={chartThemeColors.text} fontSize={11} />
                <YAxis stroke={chartThemeColors.text} fontSize={11} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartThemeColors.tooltipBg, 
                    borderColor: chartThemeColors.tooltipBorder, 
                    borderRadius: 6, fontSize: 11 
                  }} 
                />
                <Area type="monotone" dataKey="total" stroke="#38bdf8" fillOpacity={1} fill="url(#colorTotal)" name="Total Issues" />
                <Area type="monotone" dataKey="fixed" stroke="#10b981" fillOpacity={1} fill="url(#colorFixed)" name="Resolved Fixes" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Severity Distribution Pie */}
        <div className="card" style={{ padding: '16px', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Severity Distribution</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active issue classification breakdown</div>
            </div>
          </div>

          <div style={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartThemeColors.tooltipBg, 
                    borderColor: chartThemeColors.tooltipBorder, 
                    borderRadius: 6, fontSize: 11 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3 & 4 Grid: Category Breakdown & Agent Accuracy */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Categories Bar Chart */}
        <div className="card" style={{ padding: '16px', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Issues by Category
          </div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartThemeColors.grid} />
                <XAxis dataKey="name" stroke={chartThemeColors.text} fontSize={11} />
                <YAxis stroke={chartThemeColors.text} fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: chartThemeColors.tooltipBg, borderColor: chartThemeColors.tooltipBorder, borderRadius: 6, fontSize: 11 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Issues" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5-Agent Accuracy & Task Distribution */}
        <div className="card" style={{ padding: '16px', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Autonomous Agent Orchestration Performance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agentPerformanceData.map((agent, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{agent.agent} Agent</span>
                  <span style={{ color: 'var(--text-muted)' }}>{agent.accuracy}% Accuracy • {agent.avgTime}s avg</span>
                </div>
                <div style={{ width: '100%', height: 5, backgroundColor: 'var(--bg-card-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${agent.accuracy}%`, height: '100%', background: 'var(--grad-primary)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comprehensive Issues Table with Filters */}
      <div className="card" style={{ padding: '16px', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Workspace Issues Directory</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Click any issue row to inspect diagnostic evidence, root causes, and patch telemetry</div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '4px 8px', borderRadius: 'var(--radius-md)', width: 180 }}>
              <Search size={12} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search report..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 11, outline: 'none' }}
              />
            </div>

            {/* Severity Filter */}
            <select 
              value={filterSeverity} 
              onChange={(e) => setFilterSeverity(e.target.value)}
              style={{ height: 28, fontSize: 11, padding: '0 8px' }}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Status Filter */}
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ height: 28, fontSize: 11, padding: '0 8px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open Only</option>
              <option value="Fixed">Fixed Only</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="ide-table-wrapper">
          <table className="ide-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Severity</th>
                <th>Message &amp; Finding</th>
                <th style={{ width: 120 }}>File Location</th>
                <th style={{ width: 60 }}>Line</th>
                <th style={{ width: 100 }}>Category</th>
                <th style={{ width: 90 }}>Status</th>
                <th style={{ width: 90, textAlign: 'center' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredIssues.map((item) => {
                const isFixed = appliedFixes.includes(item.id) || item.status === 'Fixed';

                return (
                  <tr 
                    key={item.id}
                    onClick={() => setSelectedIssueModal(item)}
                  >
                    <td>
                      <span className={`badge badge-${item.severity.toLowerCase()}`}>
                        {item.severity}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.detail}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{item.file}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{item.line}</td>
                    <td><span className="badge badge-subtle">{item.category}</span></td>
                    <td>
                      {isFixed ? (
                        <span className="badge badge-success">
                          <CheckCircle size={10} /> Fixed
                        </span>
                      ) : (
                        <span className="badge badge-warning">Open</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ height: 22, fontSize: 10, padding: '0 6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssueModal(item);
                        }}
                      >
                        <span>Inspect</span>
                        <ChevronRight size={10} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Detail Modal */}
      {selectedIssueModal && (
        <div className="modal-overlay" onClick={() => setSelectedIssueModal(null)}>
          <div className="palette-box" style={{ width: 620 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge badge-${selectedIssueModal.severity.toLowerCase()}`}>
                  {selectedIssueModal.severity}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {selectedIssueModal.title}
                </span>
              </div>
              <button className="icon-action-btn" onClick={() => setSelectedIssueModal(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)', marginTop: 2 }}>{selectedIssueModal.detail}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Root Cause Diagnosis</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.5 }}>
                  {selectedIssueModal.rootCause || 'Evaluated AST expression without sufficient input boundary validation.'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Suggested Fix</div>
                <div style={{ 
                  backgroundColor: 'var(--bg-code-block)', padding: '8px 12px', borderRadius: 4, 
                  fontFamily: 'var(--font-mono)', fontSize: 11, marginTop: 4, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' 
                }}>
                  {selectedIssueModal.suggestedFix}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                <span>File: {selectedIssueModal.fullPath || selectedIssueModal.file}</span>
                <span>Line: {selectedIssueModal.line}</span>
                <span>Confidence: {selectedIssueModal.confidence}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
