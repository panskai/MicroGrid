import { useState } from 'react';
import OptionButton from '@/components/ui/OptionButton';
import { useProducts } from '@/context/ProductsContext';
import { useLang } from '@/context/LangContext';
import './Step2Brackets.css';

interface Step2BracketsProps {
  bracketSets: number;
  panelModel: string;
  bracketModel: string;
  onUpdate: (data: {
    bracketSets?: number;
    panelModel?: string;
    bracketModel?: string;
    componentModel?: string;
    bracketCapacity?: number;
  }) => void;
}

export default function Step2Brackets({
  bracketSets,
  panelModel,
  bracketModel,
  onUpdate,
}: Step2BracketsProps) {
  const { t, lang } = useLang();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { pvPanels, bracketSystems, calcPvKw, getPanelByModel, getBracketByModel } = useProducts();

  const selectedPanel   = getPanelByModel(panelModel);
  const selectedBracket = getBracketByModel(bracketModel);

  const handleSetsChange = (sets: number) => {
    onUpdate({ bracketSets: sets, bracketCapacity: sets * selectedBracket.panelsPerSet });
  };
  const handlePanelChange = (model: string) => {
    onUpdate({ panelModel: model, componentModel: model });
  };
  const handleBracketChange = (model: string) => {
    const b = getBracketByModel(model);
    onUpdate({ bracketModel: model, bracketCapacity: bracketSets * b.panelsPerSet });
  };

  const pvKw   = bracketSets > 0 ? calcPvKw(bracketSets, panelModel, bracketModel) : 0;
  const areaM2 = bracketSets * selectedBracket.areaM2;

  return (
    <div>
      {/* ── 支架套数 */}
      <div className="bracket-sets-selector">
        {[1, 2, 3, 4, 5].map((sets) => {
          const kw = calcPvKw(sets, panelModel, bracketModel);
          return (
            <OptionButton
              key={sets}
              label={`${sets} ${t('bracket.sets_unit')}`}
              description={
                lang === 'en'
                  ? `${sets * selectedBracket.panelsPerSet} panels · ${kw} kW · ${t('bracket.area_unit')}${sets * selectedBracket.areaM2} m²`
                  : `${sets * selectedBracket.panelsPerSet} ${t('bracket.panels_unit')} · ${kw} kW · ${t('bracket.area_unit')} ${sets * selectedBracket.areaM2} m²`
              }
              selected={bracketSets === sets}
              onClick={() => handleSetsChange(sets)}
            />
          );
        })}
      </div>

      {/* ── 高级选项 */}
      {bracketSets > 0 && (
        <div className="bracket-details">
          <button
            className="toggle-details-btn"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? t('bracket.toggle_hide') : t('bracket.toggle_show')} {t('bracket.section_panel')}
          </button>

          {showAdvanced && (
            <div className="details-form">
              {/* 组件型号选择 */}
              <div className="form-section">
                <h4 className="form-section-title">{t('bracket.panel_title')}</h4>
                <div className="model-selector-grid">
                  {pvPanels.map(panel => (
                    <div
                      key={panel.model}
                      className={`model-card ${panelModel === panel.model ? 'selected' : ''}`}
                      onClick={() => handlePanelChange(panel.model)}
                    >
                      <div className="model-name">{panel.watts}Wp</div>
                      <div className="model-detail">{panel.displayName}</div>
                      <div className="model-price">${panel.pricePerWp.toFixed(2)}/Wp</div>
                      <div className="model-efficiency">{t('bracket.efficiency')} {panel.efficiencyPct}%</div>
                      <div className="model-kw-per-set">
                        {selectedBracket.panelsPerSet} {t('bracket.panels_per_set')} = {panel.kwPerSet(selectedBracket.panelsPerSet)} {t('bracket.kw_per_set')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 支架型号选择 */}
              <div className="form-section">
                <h4 className="form-section-title">{t('bracket.bracket_title')}</h4>
                <div className="model-selector-grid">
                  {bracketSystems.map(bracket => (
                    <div
                      key={bracket.model}
                      className={`model-card ${bracketModel === bracket.model ? 'selected' : ''}`}
                      onClick={() => handleBracketChange(bracket.model)}
                    >
                      <div className="model-name">{bracket.panelsPerSet} {t('bracket.panels_per_set')}</div>
                      <div className="model-detail">{bracket.displayName}</div>
                      <div className="model-area">{lang === 'en' ? 'Area' : '占地'} {bracket.areaM2} {t('bracket.area_per_set')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 实时汇总 */}
          <div className="bracket-summary">
            <div className="summary-row">
              <span>{t('bracket.summary.panel')}</span>
              <strong>{selectedPanel.watts}Wp × {bracketSets * selectedBracket.panelsPerSet} {t('bracket.panels_unit')} = {pvKw} kW</strong>
            </div>
            <div className="summary-row">
              <span>{t('bracket.summary.bracket')}</span>
              <strong>{selectedBracket.displayName}</strong>
            </div>
            <div className="summary-row">
              <span>{t('bracket.summary.price')}</span>
              <strong>${selectedPanel.pricePerWp.toFixed(2)}/Wp（${(selectedPanel.pricePerWp * 1000).toFixed(0)}/kW）</strong>
            </div>
            <div className="summary-row">
              <span>{t('bracket.summary.area')}</span>
              <strong>{areaM2} m² {t('bracket.area_note')}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
