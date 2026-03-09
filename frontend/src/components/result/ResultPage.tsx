/**
 * ResultPage.tsx — 微电网解决方案结果页
 * 展示 API 返回的完整经济分析数据（USD）
 */
import { useState } from 'react';
import type { ConfigData, CalculateResponse, ComparisonRow } from '@/types/index';
import ROIChart from '@/components/result/ROIChart';
import ComponentCard from '@/components/ui/ComponentCard';
import DownloadReportModal from '@/components/result/DownloadReportModal';
import SchematicTopology from '@/components/topology/SchematicTopology';
import { resultToTopologyData } from '@/utils/resultToTopology';
import { useLang } from '@/context/LangContext';
import { formatAreaDual, formatFuelPriceDual, formatVolumeDual } from '@/utils/unitFormat';
import './ResultPage.css';

interface ResultPageProps {
  config:         ConfigData;
  apiResult:      CalculateResponse | null;
  isCalculating:  boolean;
  apiError:       string | null;
  isPypsaRunning?: boolean;   // PyPSA 后台精算中
  onRetry:        () => void;
  onRestart:      () => void;
}

// ── 辅助格式化 ────────────────────────────────────────────────
const fmtUsd   = (v?: number | null, d = 0) =>
  v == null ? '—' : `$${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const fmtPct   = (v?: number | null) => v == null ? '—' : `${v.toFixed(1)}%`;
const fmtNum   = (v?: number | null, d = 1) => v == null ? '—' : v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export default function ResultPage({
  config,
  apiResult,
  isCalculating,
  apiError,
  isPypsaRunning = false,
  onRetry,
  onRestart,
}: ResultPageProps) {
  const { t, lang } = useLang();
  const [activeTab, setActiveTab] = useState<'overview' | 'capex' | 'simulation' | 'comparison' | 'system' | 'schematic'>('overview');
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // ── 加载状态 ──────────────────────────────────────────────
  if (isCalculating) {
    return (
      <div className="result-page">
        <div className="result-loading">
          <div className="loading-spinner" />
          <h2>{t('result.loading')}</h2>
          <p>{t('result.loading.desc')}</p>
        </div>
      </div>
    );
  }

  // ── 错误状态 ──────────────────────────────────────────────
  if (apiError || (apiResult && !apiResult.success)) {
    const errMsg = apiError || apiResult?.error || (lang === 'en' ? 'Unknown error' : '未知错误');
    return (
      <div className="result-page">
        <div className="result-error">
          <div className="error-icon">!</div>
          <h2>{t('result.error')}</h2>
          <p className="error-msg">{errMsg}</p>
          {apiResult?.traceback && (
            <pre className="error-trace">{apiResult.traceback}</pre>
          )}
          <div className="error-actions">
            <button className="btn btn-primary" onClick={onRetry}>{t('result.retry')}</button>
            <button className="btn btn-secondary" onClick={onRestart}>{t('result.restart')}</button>
          </div>
        </div>
      </div>
    );
  }

  // ── 无结果（不应发生）──────────────────────────────────────
  if (!apiResult) {
    return (
      <div className="result-page">
        <div className="result-error">
          <h2>{t('result.no_data')}</h2>
          <button className="btn btn-secondary" onClick={onRestart}>{t('result.restart')}</button>
        </div>
      </div>
    );
  }

  const { systemConfig: sc, capex, simulation: sim, summary, comparisonTable } = apiResult;

  // ── 场景/EMS 名称 ────────────────────────────────────────
  const scenarioName: Record<string, string> = lang === 'en' ? {
    'known-load': 'Known-Load',
    'diy':        'User DIY',
    'no-load':    'No-Load',
  } : {
    'known-load': '已知负载情况',
    'diy':        '用户自定义 (DIY)',
    'no-load':    '无负载情况',
  };
  const emsName: Record<string, string> = lang === 'en' ? {
    edge:       'Edge Control',
    cloud:      'Cloud Platform',
    prediction: 'Predictive Control',
  } : {
    edge:       '边端控制',
    cloud:      '云端控制',
    prediction: '基于预测',
  };

  const breakevenLabel = summary?.breakevenYear
    ? (lang === 'en' ? `Year ${summary.breakevenYear}` : `第 ${summary.breakevenYear} 年`)
    : t('kpi.over_20');

  const lcoeCrossLabel = summary?.lcoeCrossoverYear
    ? (lang === 'en' ? `Year ${summary.lcoeCrossoverYear}` : `第 ${summary.lcoeCrossoverYear} 年`)
    : '—';

  return (
    <div className="result-page">

      {/* ── DIY 估算精度提示横幅 ── */}
      {config.scenario === 'diy' && (
        <div style={{
          background: 'linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%)',
          borderBottom: '2px solid #f6ad55',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          fontSize: '0.88rem',
          color: '#744210',
          lineHeight: 1.65,
        }}>
          <span style={{
            fontSize: '1.1rem',
            flexShrink: 0,
            marginTop: '0.05rem',
          }}>⚠️</span>
          <div>
            <strong style={{ color: '#92400e' }}>
              {lang === 'en'
                ? 'DIY Mode — Estimation Notice'
                : 'DIY 模式 — 估算精度说明'}
            </strong>
            <span style={{ marginLeft: '0.6rem' }}>
              {lang === 'en'
                ? 'This report is based on your specified voltage & current (peak demand). Since actual annual load (kWh) is unknown, the economic analysis (ROI, payback period, LCOE) is an engineering estimate with ±20–30% uncertainty. For higher accuracy, please use the '
                : '本报告基于您输入的电压与电流（峰值需求）推算，由于未提供实际年用电量（kWh），经济分析（投资回报、回本年限、LCOE）为工程估算，误差范围约 ±20–30%。如需更高精度，建议使用'}
              <strong>
                {lang === 'en' ? '"Known Load" ' : '"已知负载" '}
              </strong>
              {lang === 'en'
                ? 'path with actual consumption data.'
                : '路径并提供实际用电数据。'}
            </span>
          </div>
        </div>
      )}

      {/* ── 顶部标题栏 ── */}
      <div className="result-header">
        <div className="result-header-left">
          <h1>{t('result.title')}</h1>
          <p className="subtitle">
            {summary?.projectName || (lang === 'en' ? 'Project' : '项目')} · {t('result.subtitle')} {summary?.analysisYears ?? 20} {t('result.years')}
          </p>
        </div>
      </div>

      {/* ── PyPSA 精算进度条 ── */}
      {isPypsaRunning && (
        <div style={{
          background: 'linear-gradient(90deg, #1a365d 0%, #2b6cb0 100%)',
          color: '#fff',
          padding: '0.6rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.88rem',
        }}>
          <div style={{
            width: '120px', height: '6px',
            background: 'rgba(255,255,255,0.25)',
            borderRadius: '3px',
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <div style={{
              height: '100%',
              background: '#68d391',
              borderRadius: '3px',
              animation: 'pypsa-progress 25s linear forwards',
            }} />
          </div>
          <span>
            <strong>{t('result.pypsa_label')}</strong>
            {lang === 'en'
              ? ' (8760h hourly energy simulation) — data will update automatically upon completion'
              : '（8760h 逐小时能量仿真）— 完成后将自动更新以下数据'}
          </span>
        </div>
      )}

      {/* ── 数据来源标签 ── */}
      {!isPypsaRunning && apiResult && (
        <div style={{
          background: '#f0fff4',
          borderBottom: '2px solid #9ae6b4',
          padding: '0.45rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.82rem',
          color: '#276749',
        }}>
          <span style={{
            width: '8px', height: '8px',
            borderRadius: '50%',
            background: '#38a169',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          {t('result.simulated')}
        </div>
      )}

      {/* ── KPI 摘要卡片 ── */}
      <div className="kpi-strip">
        <div className="kpi-card">
          <div className="kpi-label">{t('kpi.quote')}</div>
          <div className="kpi-value blue">{fmtUsd(summary?.sellingPriceUsd)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('kpi.pv_kw')}</div>
          <div className="kpi-value">{fmtNum(sc?.pvCapacityKw)} kW</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('kpi.batt_kwh')}</div>
          <div className="kpi-value">{fmtNum(sc?.batteryCapacityKwh)} kWh</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('kpi.solar_frac')}</div>
          <div className="kpi-value green">{fmtPct(sim?.solarFractionPct)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('kpi.payback')}{config.scenario === 'diy' ? ' *' : ''}</div>
          <div className="kpi-value orange">{breakevenLabel}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">{t('kpi.fuel_saving')}{config.scenario === 'diy' ? ' *' : ''}</div>
          <div className="kpi-value" style={{ fontSize: '1rem', lineHeight: 1.25 }}>
            {formatVolumeDual(sim?.annualFuelSavingLiters, lang).combined}
          </div>
        </div>
      </div>

      {/* ── 标签页导航 ── */}
      <div className="result-tabs">
        {([
          ['overview',   t('tab.overview')],
          ['simulation', t('tab.simulation')],
          ['comparison', t('tab.comparison')],
          ['system',     t('tab.system')],
          // ['schematic',  lang === 'en' ? 'Product Schematic' : '产品示意图'], // 已隐藏
        ] as const).map(([key, label]) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          标签页内容
      ════════════════════════════════════════════════════════════ */}
      <div className="result-tab-content">

        {/* ── 经济总览 ── */}
        {activeTab === 'overview' && (
          <div>
            {comparisonTable && comparisonTable.length > 0 ? (
              <ROIChart
                comparisonTable={comparisonTable}
                breakevenYear={summary?.breakevenYear ?? null}
                lcoeCrossoverYear={summary?.lcoeCrossoverYear ?? null}
                sellingPrice={summary?.sellingPriceUsd ?? 0}
              />
            ) : (
              <div className="result-card" style={{ textAlign: 'center', color: '#718096' }}>
                {lang === 'en' ? 'No annual comparison data available.' : '暂无年度对比数据（API 返回中不含 comparisonTable）'}
              </div>
            )}

            {summary && (
              <div className="result-card">
                <h2 className="card-title">{t('overview.summary')}</h2>
                <div className="summary-grid">
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.annual_load')}</span>
                    <span className="sum-value">{fmtNum(summary.annualLoadKwh, 0)} kWh</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('overview.cost')}</span>
                    <span className="sum-value">{fmtUsd(summary.totalCostUsd)}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('overview.capex')}</span>
                    <span className="sum-value highlight-blue">{fmtUsd(summary.sellingPriceUsd)}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('overview.profit')}</span>
                    <span className="sum-value">{fmtUsd(summary.profitAmountUsd)}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('overview.annual_om')}</span>
                    <span className="sum-value">{fmtUsd(summary.mgAnnualOmUsd)}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('overview.annual_fuel')}</span>
                    <span className="sum-value">{fmtUsd(summary.mgAnnualFuelUsd)}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('overview.diesel_fuel')}</span>
                    <span className="sum-value highlight-red">{fmtUsd(summary.dieselAnnualFuelUsd)}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('overview.lcoe_cross')}</span>
                    <span className="sum-value">{lcoeCrossLabel}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('kpi.payback')}</span>
                    <span className="sum-value highlight-green">{breakevenLabel}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('overview.mg_lcoe')}</span>
                    <span className="sum-value">{fmtUsd(summary.finalMgLcoe, 3)}/kWh</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('overview.diesel_lcoe')}</span>
                    <span className="sum-value">{fmtUsd(summary.finalDieselLcoe, 3)}/kWh</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('overview.revenue_20')}</span>
                    <span className="sum-value highlight-green">{fmtUsd(summary.finalCumulativeRevenue)}</span>
                  </div>
                  {config.scenario === 'diy' && (
                    <div style={{
                      gridColumn: '1 / -1',
                      marginTop: '0.5rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px dashed #e2e8f0',
                      fontSize: '0.78rem',
                      color: '#a0aec0',
                      lineHeight: 1.6,
                    }}>
                      {lang === 'en'
                        ? '* DIY mode: economic figures are estimated from peak current demand. Actual annual kWh consumption was not provided — results may vary ±20–30% from reality. For a precise analysis, re-run with the "Known Load" path.'
                        : '* DIY 模式：经济数据由峰值电流需求估算，未提供实际年用电量（kWh），结果与实际情况可能相差 ±20–30%。如需精确分析，请改用"已知负载"路径重新计算。'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CAPEX 明细（暂时隐藏）──
        {activeTab === 'capex' && capex && ( ... )}
        ── */}

        {/* ── 仿真结果 ── */}
        {activeTab === 'simulation' && (
          <div className="result-card">
            <h2 className="card-title">{t('sim.title')}</h2>
            {sim ? (
              <div className="summary-grid">
                <div className="sum-row">
                  <span className="sum-label">{t('sim.solar_frac')}</span>
                  <span className="sum-value highlight-green">{fmtPct(sim.solarFractionPct)}</span>
                </div>
                <div className="sum-row">
                  <span className="sum-label">{t('sim.loss_load')}</span>
                  <span className="sum-value">{fmtPct(sim.lossOfLoadPct)}</span>
                </div>
                <div className="sum-row">
                  <span className="sum-label">{t('sim.curtail')}</span>
                  <span className="sum-value">{fmtPct(sim.curtailmentPct)}</span>
                </div>
                <div className="sum-row">
                  <span className="sum-label">{t('sim.mg_diesel')}</span>
                  <span className="sum-value">{formatVolumeDual(sim.mgDieselLiters, lang).combined}/{lang === 'en' ? 'yr' : '年'}</span>
                </div>
                <div className="sum-row">
                  <span className="sum-label">{t('sim.mg_diesel_hr')}</span>
                  <span className="sum-value">{fmtNum(sim.mgDieselHours, 0)} h/{lang === 'en' ? 'yr' : '年'}</span>
                </div>
                <div className="sum-row">
                  <span className="sum-label">{t('sim.diesel_only')}</span>
                  <span className="sum-value highlight-red">{formatVolumeDual(sim.dieselOnlyLiters, lang).combined}/{lang === 'en' ? 'yr' : '年'}</span>
                </div>
                <div className="sum-row">
                  <span className="sum-label">{t('sim.diesel_only_hr')}</span>
                  <span className="sum-value">{fmtNum(sim.dieselRunHoursA, 0)} h/{lang === 'en' ? 'yr' : '年'}</span>
                </div>
                <div className="sum-row">
                  <span className="sum-label">{t('sim.fuel_saving')}</span>
                  <span className="sum-value highlight-green">{formatVolumeDual(sim.annualFuelSavingLiters, lang).combined}</span>
                </div>
                <div className="sum-row">
                  <span className="sum-label">{t('sim.fuel_saving_usd')}</span>
                  <span className="sum-value highlight-green">{fmtUsd(sim.annualFuelSavingUsd)}</span>
                </div>
              </div>
            ) : (
              <div className="sim-note">
                <p>{t('result.sim_pending')}</p>
              </div>
            )}
          </div>
        )}

        {/* ── 年度对比表 ── */}
        {activeTab === 'comparison' && (
          <div className="result-card">
            <h2 className="card-title">{t('comp.title')}</h2>
            {comparisonTable && comparisonTable.length > 0 ? (
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('comp.year')}</th>
                      <th>{t('comp.mg_annual')}</th>
                      <th>{t('comp.diesel_annual')}</th>
                      <th>{t('comp.mg_cumul')}</th>
                      <th>{t('comp.diesel_cumul')}</th>
                      <th>{t('comp.mg_lcoe')}</th>
                      <th>{t('comp.diesel_lcoe')}</th>
                      <th>{t('comp.revenue')}</th>
                      <th>{t('comp.cumul_rev')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonTable.map((row: ComparisonRow) => (
                      <tr key={row.year} className={
                        summary?.breakevenYear === row.year ? 'tr-highlight' : ''
                      }>
                        <td>{row.year}</td>
                        <td className="td-num">{fmtUsd(row.mgAnnualCost)}</td>
                        <td className="td-num">{fmtUsd(row.dieselAnnualCost)}</td>
                        <td className="td-num">{fmtUsd(row.mgCumulative)}</td>
                        <td className="td-num">{fmtUsd(row.dieselCumulative)}</td>
                        <td className="td-num">{fmtUsd(row.mgLcoe, 3)}/kWh</td>
                        <td className="td-num">{fmtUsd(row.dieselLcoe, 3)}/kWh</td>
                        <td className={`td-num ${row.annualRevenue >= 0 ? 'pos' : 'neg'}`}>
                          {fmtUsd(row.annualRevenue)}
                        </td>
                        <td className={`td-num ${row.cumulativeRevenue >= 0 ? 'pos' : 'neg'}`}>
                          {fmtUsd(row.cumulativeRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#718096', textAlign: 'center', padding: '2rem' }}>
                {lang === 'en' ? 'Annual comparison data not available.' : '年度对比数据不可用（API 未返回 comparisonTable）'}
              </p>
            )}
          </div>
        )}

        {/* ── 系统配置 ── */}
        {activeTab === 'system' && (
          <div>
            {sc && (
              <div className="result-card">
                <h2 className="card-title">{t('sys.title')}</h2>
                <div className="summary-grid">
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.scenario')}</span>
                    <span className="sum-value">{scenarioName[config.scenario] || config.scenario}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.panel_model')}</span>
                    <span className="sum-value">{sc.panelModel} ({sc.panelWatts}Wp, ${sc.panelPricePerWp}/Wp)</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.bracket_sets')}</span>
                    <span className="sum-value">{sc.bracketSets} {lang === 'en' ? 'sets' : '套'} ({sc.bracketSets * sc.panelsPerSet} {lang === 'en' ? 'panels' : '块'})</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.pv_kw')}</span>
                    <span className="sum-value highlight-blue">{fmtNum(sc.pvCapacityKw)} kW</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.area')}</span>
                    <span className="sum-value">{formatAreaDual(sc.occupiedAreaM2, lang).combined}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.batt_model')}</span>
                    <span className="sum-value">{sc.batteryModel}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.batt_kwh')}</span>
                    <span className="sum-value">{fmtNum(sc.batteryCapacityKwh)} kWh ({sc.batteryPackCount} {lang === 'en' ? 'packs' : '包'})</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{lang === 'en' ? 'Diesel Generator' : '柴油发电机'}</span>
                    <span className="sum-value">
                      {sc.dieselCapacityKw > 0
                        ? `${sc.dieselCapacityKw} kW (${sc.dieselModel})`
                        : (lang === 'en' ? 'None' : '无')}
                    </span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.voltage')}</span>
                    <span className="sum-value">{sc.voltageLevel}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.ems')}</span>
                    <span className="sum-value">{emsName[sc.emsMode] || sc.emsMode}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.annual_load')}</span>
                    <span className="sum-value">{fmtNum(sc.annualLoadKwh, 0)} kWh</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.load_type')}</span>
                    <span className="sum-value">{sc.loadType}</span>
                  </div>
                  <div className="sum-row">
                    <span className="sum-label">{t('sys.latitude')}</span>
                    <span className="sum-value">{sc.latitude}°</span>
                  </div>
                </div>
              </div>
            )}

            {/* 系统组件卡片 */}
            <div className="components-section">
              <h2 className="card-title">{lang === 'en' ? 'System Components' : '系统组件'}</h2>
              <div className="components-grid">
                <ComponentCard
                  title={lang === 'en' ? 'Software (EMS)' : '软件 (EMS)'}
                  description={lang === 'en'
                    ? 'VoltageEnergy microgrid management system supporting edge/cloud/predictive control modes, dynamically optimizing PV-storage-diesel coordination.'
                    : 'VoltageEnergy 微电网管理系统，支持云端/边端/预测三种控制模式，动态优化光储柴协调调度。'}
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <path d="M8 21h8M12 17v4"/>
                    </svg>
                  }
                  isVital={true}
                  details={lang === 'en'
                    ? `EMS control mode: ${emsName[config.emsControlMethod] || config.emsControlMethod}. Supports real-time monitoring, fault alerts, remote O&M.`
                    : `EMS 控制模式：${emsName[config.emsControlMethod] || config.emsControlMethod}。支持实时监控、故障预警、远程运维。`}
                />
                <ComponentCard
                  title={lang === 'en' ? 'Solar PV' : '太阳能光伏'}
                  description={lang === 'en'
                    ? `${sc?.bracketSets ?? config.bracketSets} folding bracket sets, ${sc?.pvCapacityKw?.toFixed(1) ?? '—'} kW, ${sc?.panelModel ?? config.panelModel} modules.`
                    : `${sc?.bracketSets ?? config.bracketSets} 套折叠支架，${sc?.pvCapacityKw?.toFixed(1) ?? '—'} kW，${sc?.panelModel ?? config.panelModel} 组件。`}
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="5"/>
                      <path d="M12 1v4M12 19v4M23 12h-4M5 12H1M20.66 3.34l-2.83 2.83M6.17 17.83l-2.83 2.83M20.66 20.66l-2.83-2.83M6.17 6.17L3.34 3.34"/>
                    </svg>
                  }
                  isVital={true}
                  details={lang === 'en'
                    ? `Total PV ${sc?.pvCapacityKw?.toFixed(1) ?? '—'} kW, footprint ${formatAreaDual(sc?.occupiedAreaM2, lang).combined}, module ${sc?.panelModel ?? config.panelModel} (${sc?.panelWatts ?? '—'}Wp).`
                    : `光伏总容量 ${sc?.pvCapacityKw?.toFixed(1) ?? '—'} kW，占地 ${formatAreaDual(sc?.occupiedAreaM2, lang).combined}，组件型号 ${sc?.panelModel ?? config.panelModel} (${sc?.panelWatts ?? '—'}Wp)。`}
                />
                <ComponentCard
                  title={lang === 'en' ? 'Battery Storage (BESS)' : '电池储能 (BESS)'}
                  description={lang === 'en'
                    ? `${fmtNum(sc?.batteryCapacityKwh)} kWh, ${sc?.batteryPackCount ?? '—'} × ${sc?.batteryModel ?? config.batteryPackModel}, supporting ${config.storageDays}-day autonomous supply.`
                    : `${fmtNum(sc?.batteryCapacityKwh)} kWh，${sc?.batteryPackCount ?? '—'} 包 ${sc?.batteryModel ?? config.batteryPackModel}，支撑 ${config.storageDays} 天自主供电。`}
                  icon={
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="12" height="16" rx="2"/>
                      <rect x="8" y="6" width="8" height="12" fill="white" opacity="0.3"/>
                      <path d="M9 2h6v2H9z"/>
                    </svg>
                  }
                  isVital={true}
                  details={lang === 'en'
                    ? `LFP battery, 90% DoD, ≥4000 cycle life, supporting ${config.storageDays}-day continuous supply.`
                    : `磷酸铁锂 (LFP) 电池，深度放电 90%，循环寿命 ≥ 4000 次，支撑连续阴天 ${config.storageDays} 天供电。`}
                />
                {(sc?.dieselCapacityKw ?? config.dieselCapacityKw) > 0 && (
                  <ComponentCard
                    title={lang === 'en' ? 'Diesel Generator' : '柴油发电机'}
                    description={lang === 'en'
                      ? `${sc?.dieselCapacityKw ?? config.dieselCapacityKw} kW, annual run ${fmtNum(sim?.mgDieselHours, 0)} hrs in microgrid mode, fuel use reduced by ${fmtPct(sim ? (1 - sim.mgDieselLiters / (sim.dieselOnlyLiters || 1)) * 100 : null)}.`
                      : `${sc?.dieselCapacityKw ?? config.dieselCapacityKw} kW，微电网模式下年均运行 ${fmtNum(sim?.mgDieselHours, 0)} 小时，燃油消耗降低 ${fmtPct(sim ? (1 - sim.mgDieselLiters / (sim.dieselOnlyLiters || 1)) * 100 : null)}。`}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="8"/>
                        <path d="M12 4v4M12 16v4M4 12h4M16 12h4"/>
                      </svg>
                    }
                    isVital={true}
                    details={lang === 'en'
                      ? `Model: ${sc?.dieselModel ?? 'Standard'}, capacity ${sc?.dieselCapacityKw ?? config.dieselCapacityKw} kW. In microgrid mode solar covers ${fmtPct(sim?.solarFractionPct)} of load; diesel only starts during cloudy days or peak loads.`
                      : `型号：${sc?.dieselModel ?? '标准型'}，容量 ${sc?.dieselCapacityKw ?? config.dieselCapacityKw} kW。微电网协同下，太阳能承担 ${fmtPct(sim?.solarFractionPct)} 负载，柴发仅在阴天/高峰负载时启用。`}
                  />
                )}
              </div>
            </div>

            {/* 联系信息 */}
            <div className="company-info">
              <h2>{lang === 'en' ? 'Contact Us' : '联系我们'}</h2>
              <div className="contact-grid">
                {lang === 'en' ? [
                  ['Company', 'VoltageEnergy Technology Co., Ltd.'],
                  ['Address', '666 Dongsheng Rd, Zhenhai District, Ningbo, Zhejiang, China'],
                  ['Phone', '400-888-8888'],
                  ['Email', 'info@voltageenergy.com'],
                  ['Website', 'www.voltageenergy.com'],
                  ['Sales', 'sales@voltageenergy.com'],
                ] : [
                  ['公司名称', 'VoltageEnergy 能源科技有限公司'],
                  ['公司地址', '浙江省宁波市镇海区蛟川街道东生路666号'],
                  ['联系电话', '400-888-8888'],
                  ['电子邮箱', 'info@voltageenergy.com'],
                  ['官方网站', 'www.voltageenergy.com'],
                  ['业务咨询', 'sales@voltageenergy.com'],
                ].map(([label, value]) => (
                  <div key={label} className="contact-row">
                    <span className="contact-label">{label}</span>
                    <span className="contact-value">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 产品示意图 ── */}
        {activeTab === 'schematic' && (
          <div className="result-card result-schematic-wrap">
            <h2 className="card-title">{lang === 'en' ? 'Product Schematic' : '产品示意图'}</h2>
            <SchematicTopology
              className="result-schematic-topology"
              data={resultToTopologyData(apiResult, {
                panelModel: config.panelModel,
                loadType: config.loadType,
                voltageLevel: config.voltageLevel,
                dieselPriceUsd: config.dieselPriceUsd,
                lang,
              })}
            />
          </div>
        )}
      </div>

      {/* ── 底部操作 ── */}
      <div className="result-footer">
        <button className="btn btn-secondary" onClick={() => setShowDownloadModal(true)}>
          {t('sys.download_report')}
        </button>
        <button className="btn btn-primary" onClick={onRestart}>{t('sys.reconfigure')}</button>
      </div>

      {/* ── 下载报告弹窗 ── */}
      {showDownloadModal && (
        <DownloadReportModal
          reportData={{
            systemConfig:    apiResult?.systemConfig   as Record<string, unknown> | undefined,
            capex:           apiResult?.capex          as Record<string, unknown> | undefined,
            simulation:      apiResult?.simulation     as Record<string, unknown> | undefined,
            summary:         {
              ...(apiResult?.summary ? (apiResult.summary as Record<string, unknown>) : {}),
              dieselPriceDisplay: formatFuelPriceDual(config.dieselPriceUsd, lang).combined,
            },
            comparisonTable: apiResult?.comparisonTable as Record<string, unknown>[] | undefined,
          }}
          onClose={() => setShowDownloadModal(false)}
        />
      )}
    </div>
  );
}
