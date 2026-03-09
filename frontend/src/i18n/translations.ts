/**
 * translations.ts — 中英文双语翻译字典（扁平化键）
 * 覆盖整个 MicroGrid 项目所有页面的 UI 文字
 */

export type Lang = 'zh' | 'en';

export type TranslationDict = Record<string, { zh: string; en: string }>;

const dict: TranslationDict = {

  // ─────────────────────────────────────────────────────────
  // 语言切换按钮
  // ─────────────────────────────────────────────────────────
  'lang.toggle':            { zh: 'EN',    en: '中文' },

  // ─────────────────────────────────────────────────────────
  // Welcome / Header
  // ─────────────────────────────────────────────────────────
  'welcome.slogan':         { zh: 'Energy For Future',                        en: 'Energy For Future' },
  'welcome.brand':          { zh: 'VoltageEnergy',                            en: 'VoltageEnergy' },
  'welcome.subtitle':       { zh: '能源科技',                                   en: 'Energy Technology' },
  'welcome.prefix':         { zh: '体验',                                      en: 'Experience' },
  'welcome.title':          { zh: 'VoltageEnergy™ 微电网配置系统',              en: 'VoltageEnergy™ Microgrid Configuration System' },
  'welcome.desc1':          {
    zh: 'VoltageEnergy 微电网配置系统是一个简单、标准化、经过验证且可扩展的解决方案，旨在加速微电网的部署，实现更高的韧性、能源成本优化和可持续性。',
    en: 'The VoltageEnergy Microgrid Configuration System is a simple, standardized, proven and scalable solution designed to accelerate microgrid deployment for greater resilience, energy cost optimization and sustainability.',
  },
  'welcome.desc2':          {
    zh: '通过此配置工具，体验 VoltageEnergy 如何以速度和简洁性交付微电网解决方案。',
    en: 'Use this configuration tool to experience how VoltageEnergy delivers microgrid solutions with speed and simplicity.',
  },
  'welcome.cta':            { zh: '开始体验 VoltageEnergy 微电网配置系统',      en: 'Start VoltageEnergy Microgrid Configuration' },

  // ─────────────────────────────────────────────────────────
  // SideNav
  // ─────────────────────────────────────────────────────────
  'nav.standard':           { zh: '标准化产品',            en: 'Standard Products' },
  'nav.std.small':          { zh: '小型光储柴发一体',       en: 'Small PV-Storage-Diesel' },
  'nav.std.medium':         { zh: '中型光储柴发一体',       en: 'Medium PV-Storage-Diesel' },
  'nav.std.large':          { zh: '大型光储柴发一体',       en: 'Large PV-Storage-Diesel' },
  'nav.custom':             { zh: '定制化产品',             en: 'Custom Products' },
  'nav.custom.known':       { zh: '已知负载解决方案',       en: 'Known-Load Solution' },
  'nav.custom.diy':         { zh: 'DIY 解决方案',           en: 'DIY Solution' },
  'nav.status.online':      { zh: '计算引擎已连接',         en: 'Engine Connected' },
  'nav.status.pending':     { zh: '检测中...',              en: 'Checking...' },
  'nav.status.offline':     { zh: '离线模式',               en: 'Offline Mode' },

  // ─────────────────────────────────────────────────────────
  // Standard Product Page
  // ─────────────────────────────────────────────────────────
  'std.coming_soon':        { zh: '待发布....', en: 'Coming Soon....' },

  // ─────────────────────────────────────────────────────────
  // Navigation buttons (QuestionCard)
  // ─────────────────────────────────────────────────────────
  'btn.previous':           { zh: '上一步',         en: 'Previous' },
  'btn.next':               { zh: '下一步',         en: 'Next' },
  'btn.generate':           { zh: '生成配置方案',   en: 'Generate Plans' },
  'btn.calculating':        { zh: '计算方案中...',  en: 'Calculating...' },
  'btn.back_modify':        { zh: '← 返回修改',     en: '← Back to Edit' },

  // ─────────────────────────────────────────────────────────
  // Step titles
  // ─────────────────────────────────────────────────────────
  'step.location.title':        { zh: '安装地点 & 日照评估',      en: 'Installation Site & Solar Assessment' },
  'step.load.title':            { zh: '用电负载信息',              en: 'Load Information' },
  'step.area.title':            { zh: '场地面积',                  en: 'Site Area' },
  'step.generator.title':       { zh: '柴油发电机',                en: 'Diesel Generator' },
  'step.voltage.title':         { zh: '电压等级',                  en: 'Voltage Level' },
  'step.diy.setup.title':       { zh: '电压等级 & 最大电流',       en: 'Voltage Level & Max Current' },
  'step.diy.area.setup.title':  { zh: '场地面积 & 光伏组件',        en: 'Site Area & PV Module' },
  'step.diy.voltage.title':     { zh: '电压等级',                  en: 'Voltage Level' },
  'step.diy.current.title':     { zh: '电流 & 逆变器推算',         en: 'Current & Inverter Calculation' },
  'step.diy.area.title':        { zh: '场地面积 & 光伏配置',       en: 'Site Area & PV Configuration' },
  'step.diy.backup.title':      { zh: '备电时长 & 储能容量',       en: 'Backup Duration & Storage Capacity' },
  'step.diy.generator.title':   { zh: '柴油发电机（应急备用）',     en: 'Diesel Generator (Emergency Backup)' },
  'step.diy.inverter.title':    { zh: '逆变器数量选择',              en: 'Inverter Quantity Selection' },
  'step.diy.storage.title':     { zh: '储能电池包配置',              en: 'Battery Storage Configuration' },
  'step.ems.title':             { zh: 'EMS 控制方式',              en: 'EMS Control Mode' },
  'step.default.title':         { zh: '配置步骤',                  en: 'Configuration Step' },

  // ─────────────────────────────────────────────────────────
  // Step descriptions
  // ─────────────────────────────────────────────────────────
  'step.location.desc':     {
    zh: '输入安装地点，系统将自动评估当地年均日照资源，作为发电量计算的依据',
    en: 'Enter the installation site. The system will automatically assess local annual solar resources as the basis for power generation calculations.',
  },
  'step.load.desc':         {
    zh: '请输入用电负载信息，数据越详细，方案分析越精准（三种方式任选其一）',
    en: 'Enter load information. More detailed data leads to more accurate analysis. Choose one of three input methods.',
  },
  'step.area.desc':         {
    zh: '输入可安装场地面积，系统将自动计算最多可安装的折叠支架套数',
    en: 'Enter the available site area. The system will calculate the maximum number of folding bracket sets that can be installed.',
  },
  'step.generator.desc':    {
    zh: '请选择原场地是否具备柴油发电机，以及发电机容量',
    en: 'Specify whether the site has an existing diesel generator and its capacity.',
  },
  'step.voltage.desc':      {
    zh: '请选择系统所需的电压等级（影响逆变器选型）',
    en: 'Select the required system voltage level (affects inverter selection).',
  },
  'step.diy.setup.desc':        {
    zh: '选择系统电压等级，并输入总负载额定电流，系统将自动推算逆变器规格与台数',
    en: 'Select the system voltage level and enter the total rated load current. The system will automatically derive inverter specs and quantity.',
  },
  'step.diy.area.setup.desc':   {
    zh: '选择光伏组件型号，并输入可用场地面积，系统将推算可安装支架套数及PV总容量',
    en: 'Select PV module type and enter the available site area. The system will calculate bracket sets and total PV capacity.',
  },
  'step.diy.voltage.desc':  {
    zh: '首先选择系统电压等级，这将决定逆变器型号及后续电流计算标准',
    en: 'Select the system voltage level first. This determines inverter specifications and current calculation standards.',
  },
  'step.diy.current.desc':  {
    zh: '输入总负载额定电流，系统将自动推算所需逆变器功率与台数',
    en: 'Enter the total rated current. The system will automatically calculate the required inverter power and quantity.',
  },
  'step.diy.area.desc':     {
    zh: '输入可用场地面积，系统将推算可安装光伏支架套数及总发电功率',
    en: 'Enter the available site area. The system will calculate the number of PV bracket sets and total power.',
  },
  'step.diy.backup.desc':   {
    zh: '选择需要的备电时长，系统将自动计算所需储能电池容量',
    en: 'Select the required backup duration. The system will automatically calculate the required battery storage capacity.',
  },
  'step.diy.generator.desc': {
    zh: '可选配柴油发电机作为应急备用，确保连续阴天或极端情况下仍能稳定供电',
    en: 'Optionally add a diesel generator as emergency backup to ensure stable power supply during extended cloudy days or extreme conditions.',
  },
  'step.diy.inverter.desc': {
    zh: '根据光伏容配比，选择逆变器数量，系统将自动推算一体化托盘数量',
    en: 'Select inverter quantity based on PV-to-inverter sizing ratio. The system will automatically calculate the number of integrated trays.',
  },
  'step.diy.storage.desc': {
    zh: '每个一体化托盘最多16个电池包，选择电池型号和数量，获得最终储能容量',
    en: 'Each integrated tray holds up to 16 battery packs. Select battery model and quantity to determine total storage capacity.',
  },
  'step.ems.desc':          {
    zh: '边端控制为标准基础版，已默认包含；云平台及预测控制为可选附加功能',
    en: 'Edge control is the standard base version, included by default. Cloud platform and predictive control are optional add-ons.',
  },

  // ─────────────────────────────────────────────────────────
  // Step info messages
  // ─────────────────────────────────────────────────────────
  'info.location':          {
    zh: '日照资源是光伏发电量评估的核心依据。系统根据纬度估算年均峰值日照时数，误差约 ±10%。',
    en: 'Solar resources are the core basis for PV power generation assessment. The system estimates annual peak sun hours based on latitude, with ~±10% error.',
  },
  'info.load':              {
    zh: '年用电量是经济分析的核心输入。若有电费账单或现场用电记录，可直接导入 CSV 表格，方案精度最高。',
    en: 'Annual electricity consumption is the core input for economic analysis. Importing a CSV with billing or on-site records provides the highest accuracy.',
  },
  'info.area':              {
    zh: '一套标准折叠支架（32 块 655Wp）含行间走道约占地 260 m²，发电功率约 20.96 kW。',
    en: 'One standard folding bracket set (32 × 655Wp panels) requires ~260 m² including row spacing, generating ~20.96 kW.',
  },
  'info.generator':         {
    zh: '若现场已有柴油发电机，系统可与其协同工作，大幅降低柴油消耗（微电网模式下可节省约 85%）。',
    en: 'If the site already has a diesel generator, the system can work with it to significantly reduce fuel consumption (saving ~85% in microgrid mode).',
  },
  'info.voltage':           {
    zh: '北美住宅/小商业通常使用 120V/240V 分相制；三相商业用 120V/208V；工业用 277V/480V。',
    en: 'North American residential/small commercial typically uses 120V/240V split-phase; three-phase commercial uses 120V/208V; industrial uses 277V/480V.',
  },
  'info.ems':               {
    zh: '边端控制器本地独立运行，无需网络，响应速度快（毫秒级），是所有方案的基础。',
    en: 'The edge controller operates locally and independently, requires no network, responds in milliseconds, and is the foundation of all solutions.',
  },
  'info.diy.setup':           {
    zh: '输入电压等级和额定电流，系统将自动匹配逆变器规格（PF=0.9）。若有大功率电机负载，请预留 15–25% 余量。',
    en: 'Enter voltage level and rated current. The system automatically matches inverter specs (PF=0.9). For large motor loads, allow 15–25% margin.',
  },
  'info.diy.area.setup':      {
    zh: '一套标准折叠支架（32块655Wp）约占地260m²，发电约20.96kW。PV容量建议为逆变器功率的1.0–1.3倍（过配设计）。',
    en: 'One standard bracket set (32 × 655Wp) occupies ~260 m², generating ~20.96 kW. Recommended PV capacity is 1.0–1.3× inverter power (over-sizing design).',
  },
  'info.diy.voltage':       {
    zh: '选择正确的系统电压等级，将决定逆变器型号、输出端口规格及配电方案。如不确定，请参考现有配电箱铭牌或当地电工规范。',
    en: 'Selecting the correct system voltage determines inverter model, output port specs and power distribution design. If unsure, refer to your existing distribution panel nameplate or local electrical code.',
  },
  'info.diy.current':       {
    zh: '此处电流指系统总负载的额定工作电流（非启动电流）。若有大功率电机，请考虑启动电流（通常为额定的 3–7 倍），选型时留 15–25% 余量。逆变器台数超过 6 台时，建议采用分区供电方案。',
    en: 'This current refers to the rated operating current of the total system load (not starting current). For large motors, consider starting current (typically 3–7× rated). Allow 15–25% margin. If more than 6 inverters are needed, consider a zoned power supply design.',
  },
  'info.diy.area':          {
    zh: '一套标准折叠支架（32块655Wp）约占地260m²，发电约20.96kW。PV容量建议为逆变器功率的1.0~1.3倍（过配设计）。',
    en: 'One standard bracket set (32 × 655Wp) occupies ~260 m², generating ~20.96 kW. Recommended PV capacity is 1.0–1.3× inverter power (over-sizing design).',
  },
  'info.diy.backup':        {
    zh: '储能容量 = 逆变器总功率 × 备电时长 ÷ 放电深度(0.9)。建议至少配置8小时备电以满足工商业场景需求。',
    en: 'Storage capacity = total inverter power × backup hours ÷ DoD (0.9). At least 8 hours of backup is recommended for commercial/industrial scenarios.',
  },
  'info.diy.inverter':      {
    zh: '每套一体化托盘最多安置2台逆变器。容配比（PV容量/逆变器总功率）建议在0.8~1.5之间，既保证PV出力，又避免逆变器过载。',
    en: 'Each integrated tray holds up to 2 inverters. The PV-to-inverter sizing ratio should be 0.8–1.5 to ensure PV output without overloading inverters.',
  },
  'info.diy.storage':       {
    zh: '每套一体化托盘最多16个电池包。储能容量决定了离网自主运行时长，建议根据当地日照条件和用电需求合理配置。',
    en: 'Each integrated tray holds up to 16 battery packs. Storage capacity determines off-grid autonomy. Size it based on local solar conditions and load requirements.',
  },
  'info.diy.generator':     {
    zh: '柴油发电机是离网系统最可靠的兜底保障。在连续阴天、储能耗尽时自动启动，确保不间断供电。此步骤可选，不配置则为纯光储方案。',
    en: 'A diesel generator is the most reliable backup for off-grid systems. It auto-starts when batteries are depleted during prolonged cloudy periods. This step is optional — skip it for a pure PV+storage solution.',
  },

  // ─────────────────────────────────────────────────────────
  // Step3Generator
  // ─────────────────────────────────────────────────────────
  'gen.has.yes':            { zh: '有，现场已有柴油发电机',     en: 'Yes, existing diesel generator on site' },
  'gen.has.no':             { zh: '没有，需要新购',             en: 'No, a new one will be needed' },
  'gen.has.none':           { zh: '不配置柴油发电机',           en: 'No diesel generator' },
  'gen.existing.desc':      {
    zh: '现场已有设备，无需采购，仅用于系统协同仿真（不计入 CAPEX）',
    en: 'On-site equipment, no purchase needed; used only for co-simulation (not in CAPEX)',
  },
  'gen.new.desc':           {
    zh: '现场无柴发，系统将根据负荷仿真自动推荐最适合的发电机容量',
    en: 'No generator on site; system will automatically recommend optimal capacity via simulation',
  },
  'gen.none.desc':          {
    zh: '纯光伏 + 储能方案，适合太阳能资源充足或对减排要求高的场景',
    en: 'Pure PV + storage solution, ideal for sites with ample solar resources or high emission-reduction goals',
  },
  'gen.existing.cap.label': {
    zh: '请填写现有发电机额定容量（用于仿真计算，不影响采购费用）',
    en: 'Enter existing generator rated capacity (for simulation only, not included in CAPEX)',
  },
  'gen.existing.custom':    { zh: '其他容量（kW）：',             en: 'Other capacity (kW):' },
  'gen.existing.input.placeholder': { zh: '如: 25',             en: 'e.g. 25' },
  'gen.existing.selected':  {
    zh: '已填写现有柴油发电机容量：{kw} kW（不计入采购费用）',
    en: 'Existing generator capacity entered: {kw} kW (not included in CAPEX)',
  },
  'gen.new.auto':           { zh: '发电机容量将由系统自动推荐',  en: 'Generator capacity will be automatically recommended by the system' },
  'gen.new.auto.desc':      {
    zh: '系统将在下一步根据您的年用电量、光伏配置和储能容量，通过仿真计算出最合适的柴油发电机容量，确保在阴天或高峰负载时仍能稳定供电，同时最大化经济效益。',
    en: 'The system will calculate the optimal diesel generator capacity in the next step based on your annual load, PV configuration and storage capacity, ensuring stable supply during cloudy days or peak load while maximizing economic benefits.',
  },
  'gen.badge.new':          { zh: '需购置', en: 'New Purchase' },
  'gen.badge.existing':     { zh: '已有',   en: 'Existing' },

  // ─────────────────────────────────────────────────────────
  // Plan Selection Page
  // ─────────────────────────────────────────────────────────
  'plan.back':              { zh: '← 返回修改',                  en: '← Back to Edit' },
  'plan.header.title':      { zh: 'VoltageEnergy™ · 微电网方案选择', en: 'VoltageEnergy™ · Microgrid Plan Selection' },
  'plan.header.load':       { zh: '年负荷',                      en: 'Annual Load' },
  'plan.header.diesel':     { zh: '柴发',                        en: 'Diesel' },
  'plan.unit.kwh':          { zh: 'kWh',                         en: 'kWh' },
  'plan.unit.kw':           { zh: 'kW',                          en: 'kW' },
  'plan.unit.years':        { zh: '年',                          en: ' yr' },
  'plan.title':             { zh: '系统为您推荐以下 {n} 套方案', en: 'System Recommends {n} Plans for You' },
  'plan.subtitle':          {
    zh: '根据您的年用电量和场地条件，综合回本周期、NPV 和太阳能占比评分，请选择最符合需求的方案',
    en: 'Based on your annual load and site conditions, ranked by payback period, NPV and solar fraction. Please select the plan that best fits your needs.',
  },
  'plan.system_recommends': { zh: '系统为您推荐以下',             en: 'System recommends the following' },
  'plan.sets':              { zh: '套方案',                       en: ' plans for you' },
  'plan.badge.best':        { zh: '方案1  最优推荐',              en: 'Plan 1  Best Choice' },
  'plan.badge.second':      { zh: '方案2  次优推荐',              en: 'Plan 2  Runner-Up' },
  'plan.badge.third':       { zh: '方案3  备选方案',              en: 'Plan 3  Alternative' },
  // keep old keys as well
  'plan.badge.1':           { zh: '方案1  最优推荐',              en: 'Plan 1  Best Choice' },
  'plan.badge.2':           { zh: '方案2  次优推荐',              en: 'Plan 2  Runner-Up' },
  'plan.badge.3':           { zh: '方案3  备选方案',              en: 'Plan 3  Alternative' },
  'plan.brackets.unit':     { zh: '套折叠支架',                   en: 'Bracket Sets' },
  'plan.storage.unit':      { zh: 'kWh 储能',                    en: 'kWh Storage' },
  'plan.diesel.unit':       { zh: 'kW 柴发',                     en: 'kW Diesel' },
  'plan.metric.payback':    { zh: '静态回本',                    en: 'Payback' },
  'plan.metric.solar':      { zh: '太阳能占比',                   en: 'Solar Fraction' },
  'plan.metric.npv':        { zh: '10年 NPV',                    en: '10yr NPV' },
  'plan.metric.savings':    { zh: '年均节省',                    en: 'Annual Saving' },
  'plan.metric.diesel':     { zh: '微网年耗油',                   en: 'MG Annual Fuel' },
  'plan.metric.save_oil':   { zh: '节油率',                      en: 'Fuel Saving' },
  'plan.diesel.new':        { zh: '新购（计入 CAPEX）',           en: 'New Purchase (in CAPEX)' },
  'plan.diesel.exist':      { zh: '现场已有（不计入报价）',        en: 'Existing On-site (excl. from quote)' },
  'plan.diesel.existing':   { zh: '现场已有（不计入报价）',        en: 'Existing On-site (excl. from quote)' },
  'plan.compare.prefix':    { zh: '纯柴发年费用约',              en: 'Diesel-only annual cost ~$' },
  'plan.compare.suffix':    { zh: '微电网可节省约',              en: 'microgrid saves ~' },
  'plan.compare.per_yr':    { zh: '/年',                         en: '/yr' },
  'plan.btn.loading':       { zh: '计算详情中…',                 en: 'Computing…' },
  'plan.btn.select':        { zh: '选择此方案 →',                en: 'Select This Plan →' },
  'plan.bracket_sets':      { zh: '套折叠支架',                   en: ' Bracket Sets' },
  'plan.storage':           { zh: '储能',                        en: 'Storage' },
  'plan.diesel':            { zh: '柴发',                        en: 'Diesel' },
  'plan.payback':           { zh: '静态回本',                    en: 'Payback' },
  'plan.solar_frac':        { zh: '太阳能占比',                   en: 'Solar Fraction' },
  'plan.npv':               { zh: '10年 NPV',                    en: '10yr NPV' },
  'plan.annual_saving':     { zh: '年均节省',                    en: 'Annual Saving' },
  'plan.diesel_usage':      { zh: '微网年耗油',                   en: 'MG Annual Fuel' },
  'plan.fuel_saving':       { zh: '节油率',                      en: 'Fuel Saving' },
  'plan.diesel.label':      { zh: '柴发',                        en: 'Diesel Gen' },
  'plan.years':             { zh: '年',                          en: ' yr' },
  'plan.select_btn':        { zh: '选择此方案 →',                 en: 'Select This Plan →' },
  'plan.loading_detail':    { zh: '计算详情中…',                  en: 'Computing details…' },
  'plan.note.title':        { zh: '方案说明',                    en: 'Plan Notes' },
  'plan.note.best':         { zh: '方案1 最优推荐：',             en: 'Plan 1 Best Choice: ' },
  'plan.note.best.text':    {
    zh: '综合回本期、10年NPV 及太阳能占比评分最高，兼顾投资回报与供电稳定性，适合追求快速回本的客户。',
    en: 'Highest combined score for payback period, 10-year NPV and solar fraction. Balances investment return and supply stability. Ideal for clients seeking fast payback.',
  },
  'plan.note.second':       { zh: '方案2 次优推荐：',             en: 'Plan 2 Runner-Up: ' },
  'plan.note.second.text':  {
    zh: '系统规模略有差异，太阳能占比或 NPV 更优，适合希望提升绿色能源比例或长期收益更高的客户。',
    en: 'Slightly different system scale with better solar fraction or NPV. Ideal for clients seeking higher green energy ratio or better long-term returns.',
  },
  'plan.note.third':        { zh: '方案3 备选方案：',             en: 'Plan 3 Alternative: ' },
  'plan.note.third.text':   {
    zh: '第三高分方案，可作为差异化选择参考，适合有特定容量偏好或预算弹性的客户。',
    en: 'Third-ranked option as a differentiated alternative. Suitable for clients with specific capacity preferences or flexible budgets.',
  },
  'plan.note.footer':       {
    zh: '选中方案后将自动生成完整的经济分析报告，包含 CAPEX 明细、20年对比表和 LCOE 曲线。',
    en: 'After selecting a plan, a complete economic analysis report will be generated, including CAPEX breakdown, 20-year comparison table and LCOE curve.',
  },
  'plan.notes.title':       { zh: '方案说明',                    en: 'Plan Notes' },
  'plan.note1.title':       { zh: '方案1 最优推荐：',             en: 'Plan 1 Best Choice:' },
  'plan.note1':             {
    zh: '综合回本期、10年NPV 及太阳能占比评分最高，兼顾投资回报与供电稳定性，适合追求快速回本的客户。',
    en: 'Highest combined score for payback period, 10-year NPV and solar fraction. Balances investment return and supply stability. Ideal for clients seeking fast payback.',
  },
  'plan.note2.title':       { zh: '方案2 次优推荐：',             en: 'Plan 2 Runner-Up:' },
  'plan.note2':             {
    zh: '系统规模略有差异，太阳能占比或 NPV 更优，适合希望提升绿色能源比例或长期收益更高的客户。',
    en: 'Slightly different system scale with better solar fraction or NPV. Ideal for clients seeking higher green energy ratio or better long-term returns.',
  },
  'plan.note3.title':       { zh: '方案3 备选方案：',             en: 'Plan 3 Alternative:' },
  'plan.note3':             {
    zh: '第三高分方案，可作为差异化选择参考，适合有特定容量偏好或预算弹性的客户。',
    en: 'Third-ranked option as a differentiated alternative. Suitable for clients with specific capacity preferences or flexible budgets.',
  },
  'plan.auto_report':       {
    zh: '选中方案后将自动生成完整的经济分析报告，包含 CAPEX 明细、20年对比表和 LCOE 曲线。',
    en: 'After selecting a plan, a complete economic analysis report will be generated, including CAPEX breakdown, 20-year comparison table and LCOE curve.',
  },
  'plan.diesel_only_note':  { zh: '纯柴发年费用约',              en: 'Diesel-only annual cost ~' },
  'plan.mg_saving':         { zh: '，微电网可节省约',             en: ', microgrid saves ~' },
  'plan.per_year':          { zh: '/年',                         en: '/yr' },

  // ─────────────────────────────────────────────────────────
  // Result Page
  // ─────────────────────────────────────────────────────────
  'result.title':           { zh: '微电网解决方案报告',           en: 'Microgrid Solution Report' },
  'result.subtitle':        { zh: '分析周期',                    en: 'Analysis Period' },
  'result.years':           { zh: '年',                          en: ' Years' },
  'result.pypsa_running':   {
    zh: 'PyPSA 精算进行中（8760h 逐小时能量仿真）— 完成后将自动更新以下数据',
    en: 'PyPSA simulation in progress (8760h hourly energy simulation) — data will update automatically upon completion',
  },
  'result.pypsa_label':     { zh: 'PyPSA 精算进行中',            en: 'PyPSA Simulation Running' },
  'result.simulated':       {
    zh: 'PyPSA 精算结果 — 基于 8760h 逐小时能量仿真，SF / 耗油量 / LCOE 精度 ±3%',
    en: 'PyPSA Simulation Result — based on 8760h hourly energy simulation, SF / fuel / LCOE accuracy ±3%',
  },
  'result.loading':         { zh: 'PyPSA 精算运行中...',         en: 'PyPSA Simulation Running...' },
  'result.loading.desc':    {
    zh: '正在执行 8760 小时逐小时能量仿真，请稍候（约 15–30 秒）。',
    en: 'Running 8760-hour hourly energy simulation, please wait (~15–30 seconds).',
  },
  'result.error':           { zh: '计算失败',                    en: 'Calculation Failed' },
  'result.retry':           { zh: '重试',                        en: 'Retry' },
  'result.restart':         { zh: '重新配置',                    en: 'Reconfigure' },
  'result.no_data':         { zh: '暂无数据',                    en: 'No Data' },
  'result.sim_pending':     {
    zh: 'PyPSA 仿真数据尚未就绪，请稍后刷新，或点击"重试"重新运行精算。',
    en: 'PyPSA simulation data not yet available. Please refresh later or click "Retry" to rerun the simulation.',
  },

  // KPI labels
  'kpi.quote':              { zh: '系统报价',       en: 'System Quote' },
  'kpi.pv_kw':              { zh: '光伏容量',       en: 'PV Capacity' },
  'kpi.batt_kwh':           { zh: '储能容量',       en: 'Storage Capacity' },
  'kpi.solar_frac':         { zh: '太阳能占比',     en: 'Solar Fraction' },
  'kpi.payback':            { zh: '投资回本年限',   en: 'Payback Period' },
  'kpi.fuel_saving':        { zh: '年节省燃油',     en: 'Annual Fuel Saving' },
  'kpi.over_20':            { zh: '> 20年',         en: '> 20 yrs' },

  // Tab labels
  'tab.overview':           { zh: '经济概览',          en: 'Overview' },
  'tab.simulation':         { zh: 'PyPSA 仿真结果',    en: 'PyPSA Simulation' },
  'tab.comparison':         { zh: '年度对比表',         en: 'Annual Comparison' },
  'tab.system':             { zh: '系统选型参数',       en: 'System Specs' },

  // Overview tab
  'overview.summary':       { zh: '经济分析摘要',         en: 'Economic Analysis Summary' },
  'overview.capex':         { zh: '系统总报价（含利润）', en: 'Total System Quote (incl. margin)' },
  'overview.cost':          { zh: '总成本（不含利润）',   en: 'Total Cost (excl. margin)' },
  'overview.profit':        { zh: '毛利润',               en: 'Gross Profit' },
  'overview.breakeven':     { zh: '静态回本年份',         en: 'Simple Payback Year' },
  'overview.lcoe_cross':    { zh: 'LCOE 交叉年',          en: 'LCOE Crossover Year' },
  'overview.mg_lcoe':       { zh: '微电网 LCOE',           en: 'MG LCOE' },
  'overview.diesel_lcoe':   { zh: '纯柴发 LCOE',           en: 'Diesel-only LCOE' },
  'overview.revenue_20':    { zh: '20年累计收益',           en: '20yr Cumulative Revenue' },
  'overview.annual_om':     { zh: '微电网年运维费',         en: 'MG Annual O&M' },
  'overview.annual_fuel':   { zh: '微电网年燃油费',         en: 'MG Annual Fuel Cost' },
  'overview.diesel_fuel':   { zh: '纯柴发年燃油费',         en: 'Diesel-only Annual Fuel' },
  'overview.annual_saving': { zh: '年节省（对比纯柴发）',   en: 'Annual Saving (vs diesel-only)' },
  'per.kwh':                { zh: '/kWh', en: '/kWh' },
  'per.year':               { zh: '/年',  en: '/yr' },

  // Simulation tab
  'sim.title':              { zh: 'PyPSA 仿真结果（8760 小时）', en: 'PyPSA Simulation Results (8760 Hours)' },
  'sim.solar_frac':         { zh: '太阳能保障率',   en: 'Solar Fraction' },
  'sim.loss_load':          { zh: '失负荷率',       en: 'Loss of Load' },
  'sim.curtail':            { zh: '弃光率',         en: 'Curtailment' },
  'sim.mg_diesel':          { zh: '微电网耗油',     en: 'MG Fuel Use' },
  'sim.mg_diesel_hr':       { zh: '柴发运行小时',   en: 'Diesel Run Hours' },
  'sim.diesel_only':        { zh: '纯柴发耗油',     en: 'Diesel-only Fuel' },
  'sim.diesel_only_hr':     { zh: '纯柴发运行时数', en: 'Diesel-only Run Hours' },
  'sim.fuel_saving':        { zh: '年节省燃油',     en: 'Annual Fuel Saving' },
  'sim.fuel_saving_usd':    { zh: '年节省燃油费',   en: 'Annual Fuel Cost Saving' },
  'unit.liters':            { zh: '升',             en: 'L' },
  'unit.hours':             { zh: '小时',           en: 'hrs' },

  // Comparison tab
  'comp.title':             { zh: '年度成本对比（微电网 vs 纯柴发）', en: 'Annual Cost Comparison (MG vs Diesel-only)' },
  'comp.year':              { zh: '年份',           en: 'Year' },
  'comp.mg_annual':         { zh: '微网年成本',     en: 'MG Annual Cost' },
  'comp.diesel_annual':     { zh: '柴发年成本',     en: 'Diesel Annual Cost' },
  'comp.mg_cumul':          { zh: '微网累计成本',   en: 'MG Cumulative' },
  'comp.diesel_cumul':      { zh: '柴发累计成本',   en: 'Diesel Cumulative' },
  'comp.mg_lcoe':           { zh: '微网 LCOE',      en: 'MG LCOE' },
  'comp.diesel_lcoe':       { zh: '柴发 LCOE',      en: 'Diesel LCOE' },
  'comp.revenue':           { zh: '年收益',         en: 'Annual Revenue' },
  'comp.cumul_rev':         { zh: '累计收益',       en: 'Cumulative Revenue' },

  // System tab
  'sys.title':              { zh: '系统选型参数',       en: 'System Configuration Parameters' },
  'sys.scenario':           { zh: '配置场景',           en: 'Scenario' },
  'sys.pv_kw':              { zh: '光伏装机容量',       en: 'PV Installed Capacity' },
  'sys.batt_kwh':           { zh: '电池储能容量',       en: 'Battery Storage Capacity' },
  'sys.batt_packs':         { zh: '电池包数量',         en: 'Battery Pack Count' },
  'sys.diesel_kw':          { zh: '柴油发电机容量',     en: 'Diesel Generator Capacity' },
  'sys.bracket_sets':       { zh: '折叠支架套数',       en: 'Bracket Sets' },
  'sys.panel_model':        { zh: '光伏组件型号',       en: 'PV Module Model' },
  'sys.panel_wp':           { zh: '单块功率',           en: 'Panel Wattage' },
  'sys.panels_per_set':     { zh: '每套块数',           en: 'Panels / Set' },
  'sys.batt_model':         { zh: '电池包型号',         en: 'Battery Pack Model' },
  'sys.batt_kwh_per':       { zh: '单包容量',           en: 'Pack Capacity' },
  'sys.annual_load':        { zh: '年用电量',           en: 'Annual Load' },
  'sys.voltage':            { zh: '系统电压',           en: 'System Voltage' },
  'sys.ems':                { zh: 'EMS 控制',           en: 'EMS Control' },
  'sys.area':               { zh: '占用面积',           en: 'Occupied Area' },
  'sys.load_type':          { zh: '负载类型',           en: 'Load Type' },
  'sys.latitude':           { zh: '安装纬度',           en: 'Installation Latitude' },
  'sys.diesel_model':       { zh: '柴发型号',           en: 'Diesel Model' },
  'sys.download_report':    { zh: '下载选型配置方案',   en: 'Download Config Report' },
  'sys.reconfigure':        { zh: '重新配置',           en: 'Reconfigure' },

  // ─────────────────────────────────────────────────────────
  // Download Report Modal
  // ─────────────────────────────────────────────────────────
  'modal.title':            { zh: '下载选型配置方案',    en: 'Download Configuration Report' },
  'modal.desc':             {
    zh: '请填写联系信息，系统将生成 Excel 配置清单并发送至您的邮箱。',
    en: 'Please fill in your contact information. The system will generate an Excel BOM and send it to your email.',
  },
  'modal.email':            { zh: '邮箱地址',            en: 'Email Address' },
  'modal.name':             { zh: '姓名',                en: 'Full Name' },
  'modal.phone':            { zh: '电话（含区号）',      en: 'Phone (with country code)' },
  'modal.company':          { zh: '公司/机构',            en: 'Company / Organization' },
  'modal.state':            { zh: '州/省',               en: 'State / Province' },
  'modal.city':             { zh: '城市',                en: 'City' },
  'modal.send':             { zh: '发送报告',             en: 'Send Report' },
  'modal.download':         { zh: '直接下载',             en: 'Direct Download' },
  'modal.sending':          { zh: '发送中...',            en: 'Sending...' },
  'modal.success':          { zh: '报告已发送至您的邮箱！', en: 'Report sent to your email!' },
  'modal.cancel':           { zh: '取消',                 en: 'Cancel' },

  // ─────────────────────────────────────────────────────────
  // StepLocation
  // ─────────────────────────────────────────────────────────
  'loc.preset_label':       { zh: '常用安装地区',                    en: 'Common Installation Regions' },
  'loc.search_label':       { zh: '搜索安装地点（城市/国家）',        en: 'Search Installation Site (City/Country)' },
  'loc.search_placeholder': { zh: '如：Lagos, Nigeria 或 Phoenix, AZ', en: 'e.g.: Phoenix, AZ or Houston, TX' },
  'loc.search_btn':         { zh: '获取坐标',                        en: 'Get Coordinates' },
  'loc.searching':          { zh: '搜索中...',                       en: 'Searching...' },
  'loc.not_found':          { zh: '未找到该地点，请尝试英文地名或手动输入经纬度', en: 'Location not found. Try English name or enter coordinates manually.' },
  'loc.network_err':        { zh: '网络请求失败，请手动输入经纬度后点击"获取日照数据"', en: 'Network error. Please enter coordinates manually and click "Get Solar Data".' },
  'loc.coords_label':       { zh: '经纬度坐标',                      en: 'Coordinates' },
  'loc.coords_note':        { zh: '（可手动输入或从上方自动获取）',   en: '(enter manually or auto-fill above)' },
  'loc.lat':                { zh: '纬度（N+/S-）',                   en: 'Latitude (N+/S-)' },
  'loc.lon':                { zh: '经度（E+/W-）',                   en: 'Longitude (E+/W-)' },
  'loc.get_solar':          { zh: '获取日照数据',                    en: 'Get Solar Data' },
  'loc.querying':           { zh: '查询中...',                       en: 'Querying...' },
  'loc.solar_result':       { zh: '日照评估结果',                    en: 'Solar Assessment Result' },
  'loc.peak_sun':           { zh: '峰值日照时数',                    en: 'Peak Sun Hours' },
  'loc.peak_sun_unit':      { zh: '小时 / 天',                      en: 'h / day' },
  'loc.annual_hrs':         { zh: '年有效发电时数',                  en: 'Annual Effective Hours' },
  'loc.annual_hrs_unit':    { zh: '小时 / 年',                      en: 'h / year' },
  'loc.irradiance':         { zh: '年辐照量',                        en: 'Annual Irradiance' },
  'loc.irradiance_unit':    { zh: 'kWh / m²',                       en: 'kWh / m²' },
  'loc.panel_label':        { zh: '光伏组件型号',                    en: 'PV Module Model' },
  'loc.panel_note':         { zh: '（影响每套支架装机容量与发电成本）', en: '(affects power per bracket set and generation cost)' },
  'loc.panel_selected':     { zh: '已选',                            en: 'Selected' },
  'loc.panel_default':      { zh: '默认',                            en: 'Default' },
  'loc.kw_per_set':         { zh: 'kW/套',                          en: 'kW/set' },
  'loc.efficiency':         { zh: '效率',                            en: 'Efficiency' },

  // ─────────────────────────────────────────────────────────
  // Step5LoadInput
  // ─────────────────────────────────────────────────────────
  'load.mode.annual':       { zh: '输入年用电量',          en: 'Enter Annual Consumption' },
  'load.mode.hourly':       { zh: '输入分时段电流',        en: 'Enter Hourly Current Schedule' },
  'load.mode.import':       { zh: '导入 CSV 负荷表',       en: 'Import CSV Load Table' },
  'load.preset.small':      { zh: '小型住宅 — 5,000 kWh',  en: 'Small Residential — 5,000 kWh' },
  'load.preset.medium':     { zh: '中型住宅 — 18,000 kWh', en: 'Medium Residential — 18,000 kWh' },
  'load.preset.comm':       { zh: '商业站点 — 50,000 kWh', en: 'Commercial Site — 50,000 kWh' },
  'load.preset.industry':   { zh: '工业/大型商业 — 131,400 kWh', en: 'Industrial/Large Commercial — 131,400 kWh' },
  'load.annual_label':      { zh: '年用电量（kWh）',        en: 'Annual Consumption (kWh)' },
  'load.type.label':        { zh: '用电类型',               en: 'Load Type' },
  'load.type.res':          { zh: '住宅',                   en: 'Residential' },
  'load.type.comm':         { zh: '商业',                   en: 'Commercial' },
  'load.type.ind':          { zh: '工业',                   en: 'Industrial' },
  'load.elec_price':        { zh: '当地电价（USD/kWh）',    en: 'Local Electricity Price (USD/kWh)' },
  'load.diesel_price':      { zh: '柴油单价（USD/L）',      en: 'Diesel Price (USD/L)' },
  'load.diesel_price_note': { zh: '默认参考值，非实时市场数据，可根据当地油价调整', en: 'Default reference value, not real-time market data. Adjust based on local fuel prices.' },

  // ─────────────────────────────────────────────────────────
  // Step4Voltage / StepDIYVoltage
  // ─────────────────────────────────────────────────────────
  // shorthand aliases used by Step4Voltage
  'volt.120_240':           { zh: '120V/240V（单相）',      en: '120V/240V (Single-phase)' },
  'volt.120_208':           { zh: '120V/208V（三相）',      en: '120V/208V (Three-phase)' },
  'volt.277_480':           { zh: '277V/480V（三相）',      en: '277V/480V (Three-phase)' },

  'volt.select_label':      { zh: '选择系统所需电压等级',   en: 'Select the Required System Voltage Level' },
  'volt.120_240.label':     { zh: '120V/240V（单相）',      en: '120V/240V (Single-phase)' },
  'volt.120_240.desc':      { zh: '北美住宅/小型商业常用，适用于单相负载', en: 'North American residential/small commercial, for single-phase loads' },
  'volt.120_208.label':     { zh: '120V/208V（三相）',      en: '120V/208V (Three-phase)' },
  'volt.120_208.desc':      { zh: '北美商业常用，适用于三相负载', en: 'North American commercial, for three-phase loads' },
  'volt.277_480.label':     { zh: '277V/480V（三相）',      en: '277V/480V (Three-phase)' },
  'volt.277_480.desc':      { zh: '北美工业/大型商业常用，适用于大型三相负载', en: 'North American industrial/large commercial, for large three-phase loads' },

  // ─────────────────────────────────────────────────────────
  // Step8EMS
  // ─────────────────────────────────────────────────────────
  // shorthand aliases (used by existing components)
  'ems.edge':               { zh: '边端控制',                   en: 'Edge Control' },
  'ems.cloud':              { zh: '云平台管理（额外功能）',      en: 'Cloud Platform Management (Add-on)' },
  'ems.predict':            { zh: '基于预测的智能控制（额外功能）', en: 'Prediction-Based Intelligent Control (Add-on)' },
  'ems.predict.desc':       { zh: '结合气象预报优化调度',         en: 'Optimize scheduling with weather forecast' },
  // full keys
  'ems.edge.label':         { zh: '边端控制',                   en: 'Edge Control' },
  'ems.edge.badge':         { zh: '标准版 · 已包含',            en: 'Standard · Included' },
  'ems.edge.desc':          { zh: '本地边缘计算控制器，响应速度快（毫秒级），无需网络即可独立运行，可靠性高，适合所有离网场景', en: 'Local edge computing controller. Millisecond response, operates without network, high reliability. Suitable for all off-grid scenarios.' },
  'ems.optional_label':     { zh: '以下为可选附加功能，可根据项目需求选配（不影响基础运行）：', en: 'The following are optional add-ons that can be selected based on project requirements (does not affect basic operation):' },
  'ems.cloud.label':        { zh: '云平台管理（额外功能）',      en: 'Cloud Platform Management (Add-on)' },
  'ems.cloud.desc':         { zh: '远程运维与数据可视化',        en: 'Remote O&M and data visualization' },
  'ems.cloud.detail':       { zh: '通过云端平台实时监控系统运行状态、历史数据分析、报警推送及远程参数调整，适合分布式多站点统一管理。', en: 'Real-time monitoring via cloud platform, historical data analysis, alarm notifications and remote parameter adjustment. Ideal for distributed multi-site management.' },
  'ems.pred.label':         { zh: '基于预测的智能控制（额外功能）', en: 'Prediction-Based Intelligent Control (Add-on)' },
  'ems.pred.desc':          { zh: '结合气象预报优化调度',         en: 'Optimize scheduling with weather forecast' },
  'ems.pred.detail':        { zh: '接入气象预报数据，预测发电量与负荷曲线，提前优化充放电策略，进一步降低柴油消耗，适合电价敏感或减排要求高的项目。', en: 'Integrates weather forecast data to predict generation and load curves, pre-optimizes charge/discharge strategy to further reduce diesel consumption. Ideal for price-sensitive or emission-reduction projects.' },
  'ems.current_config':     { zh: '已选配置：',                  en: 'Current Selection: ' },
  'ems.edge_std':           { zh: '边端控制（标准）',             en: 'Edge Control (Standard)' },
  'ems.cloud_addon':        { zh: ' + 云平台管理',               en: ' + Cloud Platform' },
  'ems.pred_addon':         { zh: ' + 智能预测控制',             en: ' + Predictive Control' },

  // ─────────────────────────────────────────────────────────
  // StepArea
  // ─────────────────────────────────────────────────────────
  'area.info_title':        { zh: '标准折叠支架占地参考：',        en: 'Standard Folding Bracket Reference:' },
  'area.quick_label':       { zh: '快速选择典型面积',              en: 'Quick-Select Typical Area' },
  'area.input_label':       { zh: '输入可安装面积（m²）',          en: 'Enter Available Area (m²)' },
  'area.result_title':      { zh: '场地评估结果',                  en: 'Site Assessment Result' },
  'area.m2':                { zh: '可用面积（m²）',                en: 'Available Area (m²)' },
  'area.max_sets':          { zh: '最多可安装套数',                en: 'Max Installable Sets' },
  'area.occupied':          { zh: '预计占用面积（m²）',            en: 'Estimated Occupied Area (m²)' },
  'area.pv_preview':        { zh: '可选套数对应 PV 容量：',        en: 'PV Capacity by Number of Sets:' },

  // ─────────────────────────────────────────────────────────
  // StepDIYCurrent
  // ─────────────────────────────────────────────────────────
  'diy.current.quick':      { zh: '常用电流快速选择（A）',         en: 'Quick-Select Common Current (A)' },
  'diy.current.manual':     { zh: '输入额定电流（A）',             en: 'Enter Rated Current (A)' },
  'diy.current.result':     { zh: '系统推算结果',                  en: 'System Calculation Result' },
  'diy.current.rated':      { zh: '额定电流',                     en: 'Rated Current' },
  'diy.current.total_kw':   { zh: '总需求功率',                    en: 'Total Required Power' },
  'diy.current.inv_kw':     { zh: '推荐逆变器规格',                en: 'Recommended Inverter Size' },
  'diy.current.inv_count':  { zh: '推荐逆变器台数',                en: 'Recommended Inverter Count' },
  'diy.current.sizes':      { zh: '可选逆变器规格：',              en: 'Available Inverter Sizes: ' },
  'diy.current.warning':    {
    zh: '所需逆变器台数较多，建议升级至更高电压等级（277V/480V 工业三相）以减少设备数量，降低安装复杂度。',
    en: 'A large number of inverters required. Consider upgrading to a higher voltage level (277V/480V industrial three-phase) to reduce equipment count and installation complexity.',
  },
  'diy.current.recommended':{ zh: '[推荐]', en: '[Recommended]' },

  // ─────────────────────────────────────────────────────────
  // StepDIYArea
  // ─────────────────────────────────────────────────────────
  'diy.area.panel_label':   { zh: '选择光伏组件型号（容量）',       en: 'Select PV Module Model (Capacity)' },
  'diy.area.quick':         { zh: '快速选择典型面积',               en: 'Quick-Select Typical Area' },
  'diy.area.manual':        { zh: '输入可用场地面积（m²）',         en: 'Enter Available Site Area (m²)' },
  'diy.area.result':        { zh: '场地评估 & 光伏配置推算',        en: 'Site Assessment & PV Configuration' },
  'diy.area.m2':            { zh: '可用面积',                      en: 'Available Area' },
  'diy.area.max_sets':      { zh: '最多可安装',                    en: 'Max Installable' },
  'diy.area.max_pv':        { zh: '最大PV容量',                    en: 'Max PV Capacity' },
  'diy.area.match.good':    { zh: '匹配',                          en: 'Match' },
  'diy.area.match.low':     { zh: '欠配',                          en: 'Under-sized' },
  'diy.area.match.over':    { zh: '过配',                          en: 'Over-sized' },
  'diy.area.over_note':     { zh: '* PV 容量建议为逆变器额定功率的 1.0–1.3 倍（过配设计），以弥补光照不足时的发电损失。', en: '* Recommended PV capacity is 1.0–1.3× inverter rated power (over-sizing design) to compensate for generation losses during low irradiance.' },
  'diy.area.selected_v':    { zh: '已选电压：',                    en: 'Selected Voltage: ' },
  'diy.area.inv_power':     { zh: '逆变器功率：',                  en: 'Inverter Power: ' },

  // ─────────────────────────────────────────────────────────
  // StepDIYBackup
  // ─────────────────────────────────────────────────────────
  'diy.backup.inv_ref':     { zh: '逆变器总功率：',                en: 'Total Inverter Power: ' },
  'diy.backup.select':      { zh: '选择备电时长',                  en: 'Select Backup Duration' },
  'diy.backup.pack_label':  { zh: '选择电池包型号',                en: 'Select Battery Pack Model' },
  'diy.backup.summary':     { zh: '当前配置：',                   en: 'Current Config: ' },
  'diy.backup.recommended': { zh: '推荐',                         en: 'Recommended' },
  'diy.backup.h2':          { zh: '2 小时 — 短时备用',            en: '2 hrs — Short backup' },
  'diy.backup.h4':          { zh: '4 小时 — 一般备用',            en: '4 hrs — Standard backup' },
  'diy.backup.h6':          { zh: '6 小时 — 中等备用',            en: '6 hrs — Medium backup' },
  'diy.backup.h8':          { zh: '8 小时 — 标准备用',            en: '8 hrs — Full-day backup' },
  'diy.backup.h12':         { zh: '12 小时 — 较长备用',           en: '12 hrs — Extended backup' },
  'diy.backup.h24':         { zh: '24 小时 — 全天备用',           en: '24 hrs — Full-day backup' },
  'diy.backup.h48':         { zh: '48 小时 — 超长备用',           en: '48 hrs — 2-day backup' },

  // ─────────────────────────────────────────────────────────
  // Step6Storage
  // ─────────────────────────────────────────────────────────
  'storage.day1':              { zh: '1 天',     en: '1 Day' },
  'storage.day2':              { zh: '2 天',     en: '2 Days' },
  'storage.day3':              { zh: '3 天',     en: '3 Days' },
  'storage.day1.desc':         { zh: '适合太阳能资源好的地区（年阴天 < 30 天）', en: 'Suitable for regions with good solar resources (< 30 cloudy days/year)' },
  'storage.day2.desc':         { zh: '适合偶尔连续阴天地区（年阴天 30–60 天）',  en: 'Suitable for regions with occasional consecutive cloudy days (30–60 days/year)' },
  'storage.day3.desc':         { zh: '适合光照较差或高可靠性要求场景',           en: 'Suitable for poor solar regions or high-reliability requirements' },
  'storage.recommended':       { zh: '推荐',     en: 'Recommended' },
  'storage.select_days':       { zh: '选择储能支撑天数', en: 'Select Storage Support Days' },
  'storage.pack_label':        { zh: '选择电池包型号', en: 'Select Battery Pack Model' },
  'storage.pack_label_note':   { zh: '（型号数据实时来自产品配置文件）', en: '(model data from live product catalog)' },
  'storage.current_config':    { zh: '当前配置：', en: 'Current Config: ' },
  'storage.packs':             { zh: '包',        en: ' packs' },
  'storage.ref_cost':          { zh: '参考费用',  en: 'Ref. Cost' },
  'storage.cycle_life':        { zh: '循环寿命',  en: 'Cycle Life' },
  'storage.times':             { zh: '次',        en: ' cycles' },
  'storage.load_rec_title':    { zh: '按负荷推荐', en: 'Load-based Recommendation' },
  'storage.load_rec_sub':      { zh: '两种配置模式可选：', en: 'Two configuration modes:' },
  'storage.mode_col':          { zh: '模式', en: 'Mode' },
  'storage.day1_col':          { zh: '1 天储能', en: '1-Day Storage' },
  'storage.day2_col':          { zh: '2 天储能', en: '2-Day Storage' },
  'storage.notes_col':         { zh: '说明', en: 'Notes' },
  'storage.hybrid_mode':       { zh: '协同模式', en: 'Hybrid Mode' },
  'storage.hybrid_formula':    { zh: '日均×50%÷DoD', en: 'Daily×50%÷DoD' },
  'storage.hybrid_note':       { zh: '有柴发/光伏兜底，电池负责夜间+峰值平滑', en: 'Generator/PV as backup; battery handles overnight & peak smoothing' },
  'storage.auto_mode':         { zh: '高自治模式', en: 'Autonomous Mode' },
  'storage.auto_formula':      { zh: '日均×100%÷DoD', en: 'Daily×100%÷DoD' },
  'storage.auto_note':         { zh: '纯光储，无柴发，电池独立支撑完整一天', en: 'Pure PV+storage, no diesel; battery supports a full day independently' },
  'storage.pv_rec_title':      { zh: '按光伏/柴发推荐（工程经验公式）', en: 'PV/Diesel-based Recommendation (Engineering Formula)' },
  'storage.pv_label':          { zh: '光伏', en: 'PV' },
  'storage.diesel_label':      { zh: '柴油发电机', en: 'Diesel Generator' },
  'storage.sets_label':        { zh: '套', en: ' sets' },
  'storage.pv_day':            { zh: '天', en: ' day' },
  'storage.packs_unit':        { zh: '包', en: ' packs' },
  'storage.extra_note':        { zh: '额外的折叠支架将叠加到一体机的 PV 容量上，进一步提升太阳能发电占比。', en: 'Additional bracket sets will add to the integrated unit\'s PV capacity, further increasing solar fraction.' },
  'storage.load_note_prefix':  { zh: '* 以上基于 LFP-16kWh（$3,100/包）。如使用参考案例（4套PV + 40kW柴发），协同模式1天 = 11包，与Excel案例16包的差异来自 PV×3h 公式，两种方法均合理。', en: '* Based on LFP-16kWh ($3,100/pack). For reference case (4 sets PV + 40kW diesel), hybrid 1-day = 11 packs. Difference vs 16 packs in Excel comes from PV×3h formula; both methods are valid.' },

  // ─────────────────────────────────────────────────────────
  // Step2Brackets
  // ─────────────────────────────────────────────────────────
  'bracket.sets_unit':         { zh: '套折叠支架', en: ' Bracket Sets' },
  'bracket.panels_unit':       { zh: '块组件', en: ' panels' },
  'bracket.area_unit':         { zh: '占地约', en: 'Area ~' },
  'bracket.toggle_show':       { zh: '▼ 展开', en: '▼ Expand' },
  'bracket.toggle_hide':       { zh: '▲ 收起', en: '▲ Collapse' },
  'bracket.section_panel':     { zh: '光伏组件 & 支架型号选择', en: 'PV Module & Bracket Model' },
  'bracket.panel_title':       { zh: '光伏组件型号', en: 'PV Module Model' },
  'bracket.bracket_title':     { zh: '支架型号', en: 'Bracket Model' },
  'bracket.efficiency':        { zh: '效率', en: 'Efficiency' },
  'bracket.kw_per_set':        { zh: 'kW/套', en: 'kW/set' },
  'bracket.panels_per_set':    { zh: '块/套', en: ' panels/set' },
  'bracket.area_per_set':      { zh: 'm²/套', en: ' m²/set' },
  'bracket.summary.panel':     { zh: '光伏组件', en: 'PV Modules' },
  'bracket.summary.bracket':   { zh: '支架型号', en: 'Bracket Model' },
  'bracket.summary.price':     { zh: '组件单价', en: 'Panel Unit Price' },
  'bracket.summary.area':      { zh: '总占地面积', en: 'Total Area' },
  'bracket.area_note':         { zh: '（无阴影遮挡）', en: '(no shading)' },

  // ─────────────────────────────────────────────────────────
  // Step7Tray
  // ─────────────────────────────────────────────────────────
  'tray.pv_label':             { zh: '光伏', en: 'PV' },
  'tray.storage_label':        { zh: '储能', en: 'Storage' },
  'tray.annual_gen':           { zh: '估算年发电', en: 'Est. Annual Gen.' },
  'tray.extra_note':           { zh: '额外的折叠支架将叠加到一体机的 PV 容量上，进一步提升太阳能发电占比。', en: 'Additional bracket sets will add to the integrated unit\'s PV capacity, further increasing solar fraction.' },

  // ─────────────────────────────────────────────────────────
  // Step5LoadInput
  // ─────────────────────────────────────────────────────────
  'load.hint':                 { zh: '三种输入方式均可使用，数据越详细，方案分析结果越精准。您可以根据现有资料选择任意一种填写。', en: 'All three input methods are available. More detailed data leads to more accurate analysis. Choose any method based on available information.' },
  'load.mode.annual.hint':     { zh: '简单快速，适合初步评估', en: 'Simple & fast, for initial estimate' },
  'load.mode.hourly.hint':     { zh: '按时段填写，方案更精准', en: 'By time slot, more accurate' },
  'load.mode.import.hint':     { zh: '最精准，支持 CSV 格式', en: 'Most accurate, CSV format' },
  'load.mode.annual.label':    { zh: '年总用电量', en: 'Annual kWh' },
  'load.mode.hourly.label':    { zh: '时段电力情况', en: 'Hourly Profile' },
  'load.mode.import.label':    { zh: '导入用电表格', en: 'Import CSV' },
  'load.quick_select':         { zh: '快速选择示例值', en: 'Quick-select example values' },
  'load.annual_kwh_label':     { zh: '年总用电量（kWh/年）', en: 'Annual Electricity Consumption (kWh/yr)' },
  'load.annual_kwh_unit':      { zh: 'kWh/年', en: 'kWh/yr' },
  'load.placeholder':          { zh: '请输入，如 131400', en: 'e.g. 131400' },
  'load.daily_avg':            { zh: '日均', en: 'Daily avg' },
  'load.monthly_avg':          { zh: '月均', en: 'Monthly avg' },
  'load.est_peak':             { zh: '估算峰值负荷', en: 'Est. peak load' },
  'load.hourly_desc':          { zh: '请填写典型一天各时段的平均用电功率（kW）。系统将推算年总用电量和峰值需求。', en: 'Enter average power (kW) for each time slot of a typical day. The system will estimate annual total consumption and peak demand.' },
  'load.kwh_per_day':          { zh: 'kWh/天', en: 'kWh/day' },
  'load.slot.daily_avg':       { zh: '日均用电', en: 'Daily avg' },
  'load.slot.annual':          { zh: '年总用电', en: 'Annual total' },
  'load.slot.peak':            { zh: '峰值', en: 'Peak' },
  'load.csv_format':           { zh: '支持格式：', en: 'Supported format:' },
  'load.csv_format_desc':      { zh: 'CSV 文件，每行一个功率值（kW），可以是小时级（8760 行）或日级（365 行）数据。多列时取最后一列为功率值；首行如为标题行会自动跳过。', en: 'CSV file, one power value (kW) per row. Can be hourly (8760 rows) or daily (365 rows). Multi-column: last column is taken as power; first row is skipped if it is a header.' },
  'load.csv_click':            { zh: '点击选择 CSV 文件', en: 'Click to select CSV file' },
  'load.csv_drag':             { zh: '支持拖放上传', en: 'Supports drag and drop' },
  'load.csv_imported':         { zh: '文件已导入', en: 'File Imported' },
  'load.csv_reupload':         { zh: '点击重新上传', en: 'Click to re-upload' },
  'load.csv_err_rows':         { zh: '文件数据行数过少（至少需要 8 行），请检查格式', en: 'Too few data rows (at least 8 required). Please check the format.' },
  'load.csv_err_parse':        { zh: '文件解析失败，请确保是 UTF-8 编码的 CSV 文件', en: 'File parsing failed. Please ensure it is a UTF-8 encoded CSV file.' },
  'load.type.label_note':      { zh: '（影响用电规律曲线估算）', en: '(affects load curve estimation)' },
  'load.type.residential':     { zh: '住宅用电', en: 'Residential' },
  'load.type.commercial':      { zh: '商业用电', en: 'Commercial' },
  'load.type.industrial':      { zh: '工业用电', en: 'Industrial' },
  'load.type.res.desc':        { zh: '家庭、营地、农村住房', en: 'Homes, camps, rural housing' },
  'load.type.comm.desc':       { zh: '商店、学校、办公室、诊所', en: 'Shops, schools, offices, clinics' },
  'load.type.ind.desc':        { zh: '矿山、泵站、通信基站、工厂', en: 'Mines, pump stations, factories' },
  'load.ex.small_res':         { zh: '小型住宅', en: 'Small Residential' },
  'load.ex.medium_res':        { zh: '中型住宅', en: 'Medium Residential' },
  'load.ex.commercial':        { zh: '商业站点', en: 'Commercial Site' },
  'load.ex.industrial':        { zh: '工业/大型商业', en: 'Industrial/Large' },
  'load.ex.small_res.desc':    { zh: '约 14 kWh/天', en: '~14 kWh/day' },
  'load.ex.medium_res.desc':   { zh: '约 49 kWh/天', en: '~49 kWh/day' },
  'load.ex.commercial.desc':   { zh: '约 137 kWh/天', en: '~137 kWh/day' },
  'load.ex.industrial.desc':   { zh: '约 360 kWh/天', en: '~360 kWh/day' },

  // ─────────────────────────────────────────────────────────
  // App.tsx remaining
  // ─────────────────────────────────────────────────────────
  'app.calculating':           { zh: '计算方案中...', en: 'Calculating...' },
  'app.api_unavailable':       { zh: 'API 服务未启动。\n\n请在终端运行：\n  cd Micro/backend\n  python app/main.py\n\n或双击 Micro/start-all.bat 同时启动前后端。', en: 'API service not started.\n\nPlease run in terminal:\n  cd Micro/backend\n  python app/main.py\n\nOr double-click Micro/start-all.bat to start both servers.' },
  'app.opt_failed':            { zh: '优化计算失败，请检查输入参数', en: 'Optimization failed. Please check input parameters.' },
  'app.pypsa_failed': { zh: '后端计算失败，请检查 main.py 日志', en: 'Backend calculation failed. Please check main.py logs.' },
  'app.pypsa_detail_failed':   { zh: 'PyPSA 精算失败', en: 'PyPSA simulation failed' },
  'app.generate_plans':        { zh: '生成配置方案', en: 'Generate Plans' },

  // ─────────────────────────────────────────────────────────
  // Time slot labels (Step5LoadInput hourly mode)
  // ─────────────────────────────────────────────────────────
  'load.slot.midnight':        { zh: '深夜 (0:00–6:00)', en: 'Midnight (0:00–6:00)' },
  'load.slot.morning':         { zh: '早晨 (6:00–9:00)', en: 'Morning (6:00–9:00)' },
  'load.slot.forenoon':        { zh: '上午 (9:00–12:00)', en: 'Forenoon (9:00–12:00)' },
  'load.slot.afternoon':       { zh: '下午 (12:00–18:00)', en: 'Afternoon (12:00–18:00)' },
  'load.slot.evening':         { zh: '晚间 (18:00–22:00)', en: 'Evening (18:00–22:00)' },
  'load.slot.night':           { zh: '夜间 (22:00–24:00)', en: 'Night (22:00–24:00)' },
};

export default dict;
