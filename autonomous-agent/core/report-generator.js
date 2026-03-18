/**
 * HTML Report Generator
 *
 * Generates rich, interactive HTML reports with screenshots, timing data,
 * network analysis, healing history, and visual regression results.
 */

const fs = require('fs');
const path = require('path');

class ReportGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || path.join(process.cwd(), 'autonomous-agent', 'reports');
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
  }

  generate(data) {
    const {
      taskName = 'Autonomous Agent Run',
      duration = 0,
      steps = [],
      networkAnalysis = {},
      healingReport = {},
      visualReport = {},
      screenshots = [],
      variables = {},
      errors = [],
    } = data;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `report_${timestamp}.html`;
    const filePath = path.join(this.outputDir, fileName);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agent Report - ${taskName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f23; color: #e0e0e0; padding: 20px; }
  .container { max-width: 1400px; margin: 0 auto; }
  .header { background: linear-gradient(135deg, #1a1a3e 0%, #2d1b69 100%); border-radius: 16px; padding: 40px; margin-bottom: 24px; border: 1px solid #333; }
  .header h1 { font-size: 2em; background: linear-gradient(90deg, #00d4ff, #7b61ff, #ff6b9d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
  .header .meta { color: #888; font-size: 0.9em; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px; }
  .card { background: #1a1a2e; border-radius: 12px; padding: 24px; border: 1px solid #2a2a4a; transition: transform 0.2s; }
  .card:hover { transform: translateY(-2px); border-color: #7b61ff; }
  .card h2 { font-size: 1.1em; color: #7b61ff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .stat { font-size: 2.5em; font-weight: 700; color: #00d4ff; }
  .stat-label { font-size: 0.85em; color: #666; margin-top: 4px; }
  .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #2a2a4a; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 0.8em; font-weight: 600; }
  .badge-ok { background: #0a3d2a; color: #00ff88; }
  .badge-fail { background: #3d0a0a; color: #ff4444; }
  .badge-warn { background: #3d3a0a; color: #ffcc00; }
  .badge-info { background: #0a2a3d; color: #00d4ff; }
  .badge-retry { background: #3d2a0a; color: #ff8800; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { text-align: left; padding: 10px 12px; background: #12122a; color: #7b61ff; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 10px 12px; border-bottom: 1px solid #1f1f3a; font-size: 0.9em; }
  tr:hover td { background: #16163a; }
  .progress-bar { height: 8px; background: #2a2a4a; border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .screenshot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; margin-top: 12px; }
  .screenshot-card { background: #12122a; border-radius: 8px; overflow: hidden; border: 1px solid #2a2a4a; }
  .screenshot-card img { width: 100%; height: 180px; object-fit: cover; }
  .screenshot-card .caption { padding: 8px 12px; font-size: 0.85em; color: #888; }
  .timeline { position: relative; padding-left: 30px; }
  .timeline::before { content: ''; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: #2a2a4a; }
  .timeline-item { position: relative; margin-bottom: 16px; padding: 12px; background: #12122a; border-radius: 8px; border: 1px solid #2a2a4a; }
  .timeline-item::before { content: ''; position: absolute; left: -24px; top: 16px; width: 10px; height: 10px; border-radius: 50%; }
  .timeline-item.ok::before { background: #00ff88; }
  .timeline-item.fail::before { background: #ff4444; }
  .timeline-item.retry::before { background: #ff8800; }
  .tab-container { margin-top: 12px; }
  .tab-buttons { display: flex; gap: 4px; margin-bottom: 12px; }
  .tab-btn { padding: 8px 20px; background: #12122a; border: 1px solid #2a2a4a; border-radius: 8px 8px 0 0; color: #888; cursor: pointer; font-size: 0.9em; }
  .tab-btn.active { background: #1a1a2e; color: #7b61ff; border-color: #7b61ff; border-bottom-color: #1a1a2e; }
  .tab-content { display: none; }
  .tab-content.active { display: block; }
  .error-box { background: #2a0a0a; border: 1px solid #ff4444; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .error-box .error-msg { color: #ff6666; font-family: monospace; font-size: 0.9em; }
  .chart-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .chart-bar-label { width: 100px; font-size: 0.85em; color: #888; text-align: right; }
  .chart-bar-track { flex: 1; height: 24px; background: #12122a; border-radius: 4px; overflow: hidden; }
  .chart-bar-fill { height: 100%; border-radius: 4px; display: flex; align-items: center; padding-left: 8px; font-size: 0.75em; color: white; font-weight: 600; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .card { animation: fadeIn 0.4s ease-out both; }
  .card:nth-child(1) { animation-delay: 0.05s; }
  .card:nth-child(2) { animation-delay: 0.1s; }
  .card:nth-child(3) { animation-delay: 0.15s; }
  .card:nth-child(4) { animation-delay: 0.2s; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${taskName}</h1>
    <div class="meta">Generated: ${new Date().toLocaleString()} | Duration: ${this._formatDuration(duration)}</div>
  </div>

  <!-- Summary Cards -->
  <div class="grid">
    <div class="card">
      <h2>Steps Executed</h2>
      <div class="stat">${steps.length}</div>
      <div class="stat-label">${steps.filter(s => s.status === 'OK').length} passed, ${steps.filter(s => s.status === 'FAILED').length} failed</div>
      <div class="progress-bar" style="margin-top: 12px;">
        <div class="progress-fill" style="width: ${steps.length > 0 ? (steps.filter(s => s.status === 'OK').length / steps.length * 100) : 0}%; background: linear-gradient(90deg, #00ff88, #00d4ff);"></div>
      </div>
    </div>
    <div class="card">
      <h2>Network</h2>
      <div class="stat">${networkAnalysis.totalRequests || 0}</div>
      <div class="stat-label">requests (${networkAnalysis.blockedCount || 0} blocked, ${networkAnalysis.failedCount || 0} failed)</div>
    </div>
    <div class="card">
      <h2>Self-Healing</h2>
      <div class="stat">${healingReport.successRate || 'N/A'}</div>
      <div class="stat-label">${healingReport.totalAttempts || 0} attempts, ${healingReport.successfulHeals || 0} healed</div>
    </div>
    <div class="card">
      <h2>Visual Regression</h2>
      <div class="stat">${visualReport.passRate || 'N/A'}</div>
      <div class="stat-label">${visualReport.total || 0} comparisons, ${visualReport.mismatches || 0} mismatches</div>
    </div>
  </div>

  <!-- Execution Timeline -->
  <div class="card" style="margin-bottom: 24px;">
    <h2>Execution Timeline</h2>
    <div class="timeline">
      ${steps.map((step, i) => `
        <div class="timeline-item ${step.status === 'OK' ? 'ok' : step.status === 'RETRY' ? 'retry' : 'fail'}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: #e0e0e0;">#${i + 1} ${step.action}</strong>
              ${step.selector ? `<span style="color: #666; margin-left: 8px;">${step.selector}</span>` : ''}
              ${step.label ? `<span class="badge badge-info">${step.label}</span>` : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${step.duration ? `<span style="color: #666; font-size: 0.85em;">${step.duration}ms</span>` : ''}
              <span class="badge ${step.status === 'OK' ? 'badge-ok' : step.status === 'RETRY' ? 'badge-retry' : 'badge-fail'}">${step.status}</span>
            </div>
          </div>
          ${step.error ? `<div style="color: #ff6666; font-size: 0.85em; margin-top: 6px; font-family: monospace;">${step.error}</div>` : ''}
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Network Analysis -->
  ${networkAnalysis.totalRequests ? `
  <div class="card" style="margin-bottom: 24px;">
    <h2>Network Analysis</h2>
    <div class="grid" style="margin-bottom: 16px;">
      ${Object.entries(networkAnalysis.byResourceType || {}).map(([type, count]) => `
        <div class="chart-bar">
          <div class="chart-bar-label">${type}</div>
          <div class="chart-bar-track">
            <div class="chart-bar-fill" style="width: ${(count / networkAnalysis.totalRequests * 100)}%; background: #7b61ff;">${count}</div>
          </div>
        </div>
      `).join('')}
    </div>
    ${(networkAnalysis.slowestRequests || []).length > 0 ? `
      <h3 style="color: #888; font-size: 0.9em; margin-bottom: 8px;">Slowest Requests</h3>
      <table>
        <tr><th>URL</th><th>Time</th></tr>
        ${networkAnalysis.slowestRequests.slice(0, 5).map(r => `
          <tr><td style="max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.url}</td><td>${Math.round(r.time)}ms</td></tr>
        `).join('')}
      </table>
    ` : ''}
  </div>
  ` : ''}

  <!-- Errors -->
  ${errors.length > 0 ? `
  <div class="card" style="margin-bottom: 24px;">
    <h2>Errors</h2>
    ${errors.map(err => `
      <div class="error-box">
        <div class="error-msg">${typeof err === 'string' ? err : err.message || JSON.stringify(err)}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- Variables -->
  ${Object.keys(variables).length > 0 ? `
  <div class="card" style="margin-bottom: 24px;">
    <h2>Extracted Variables</h2>
    <table>
      <tr><th>Variable</th><th>Value</th></tr>
      ${Object.entries(variables).map(([k, v]) => `
        <tr><td style="color: #00d4ff; font-family: monospace;">${k}</td><td>${typeof v === 'object' ? JSON.stringify(v) : v}</td></tr>
      `).join('')}
    </table>
  </div>
  ` : ''}

  <!-- Screenshots -->
  ${screenshots.length > 0 ? `
  <div class="card" style="margin-bottom: 24px;">
    <h2>Screenshots</h2>
    <div class="screenshot-grid">
      ${screenshots.map(s => `
        <div class="screenshot-card">
          <img src="${path.relative(this.outputDir, s.path)}" alt="${s.name}" onerror="this.style.display='none'">
          <div class="caption">${s.name} - ${s.timestamp ? new Date(s.timestamp).toLocaleTimeString() : ''}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <div style="text-align: center; color: #444; font-size: 0.8em; padding: 20px;">
    Autonomous Agent Report &bull; Generated by Playwright Agent System
  </div>
</div>

<script>
  // Tab functionality
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabGroup = btn.closest('.tab-container');
      tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      tabGroup.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      tabGroup.querySelector('#' + btn.dataset.tab).classList.add('active');
    });
  });
</script>
</body>
</html>`;

    fs.writeFileSync(filePath, html);
    console.log(`[Report] Generated: ${filePath}`);
    return filePath;
  }

  _formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  }
}

module.exports = ReportGenerator;
