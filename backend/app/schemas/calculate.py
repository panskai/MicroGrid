"""
schemas/calculate.py — /api/calculate 请求 & 响应模型
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class CalculateRequest(BaseModel):
    # ── 基本配置 ──────────────────────────────────────────────
    scenario:          str   = Field("known-load", description="known-load | diy")
    bracketSets:       int   = Field(4, ge=0)
    panelModel:        str   = "655W"
    bracketModel:      str   = "standard_32"
    batteryPackModel:  str   = "LFP-10kWh"

    # ── 柴油发电机 ────────────────────────────────────────────
    hasGenerator:      bool  = True
    dieselCapacityKw:  float = Field(40.0, ge=0)
    dieselIsNew:       bool  = False

    # ── 电压等级 ──────────────────────────────────────────────
    voltageLevel:      str   = "120V/240V"

    # ── 储能 ──────────────────────────────────────────────────
    storageDays:       int   = Field(1, ge=1, le=3)

    # ── EMS ───────────────────────────────────────────────────
    emsControlMethod:  str   = "cloud"

    # ── 已知负载路径 ──────────────────────────────────────────
    annualLoadKwh:     Optional[float] = None
    loadType:          str   = "residential"

    # ── 无负载路径 ────────────────────────────────────────────
    trayCapacity:      Optional[str]   = None

    # ── DIY 路径 ──────────────────────────────────────────────
    requiredCurrent:   Optional[float] = None
    inverterCount:     Optional[int]   = None

    # ── 经济参数 ──────────────────────────────────────────────
    electricityPriceUsd: float = 0.35
    dieselPriceUsd:      float = 0.95
    latitude:            float = 25.0
    year:                int   = 2020


class SystemConfigResult(BaseModel):
    scenario:           str
    pvCapacityKw:       float
    batteryCapacityKwh: float
    batteryPackCount:   int
    dieselCapacityKw:   float
    dieselKwComparison: float
    bracketSets:        int
    panelModel:         str
    panelWatts:         int
    panelPricePerWp:    float
    panelsPerSet:       int
    batteryModel:       str
    batteryPackKwh:     float
    annualLoadKwh:      float
    voltageLevel:       str
    emsMode:            str
    occupiedAreaM2:     float
    loadType:           str
    latitude:           float
    dieselModel:        str


class CapexResult(BaseModel):
    pvModuleCost:        float
    pvMountingCost:      float
    energyStorageCost:   float
    dieselGeneratorCost: float
    intlTransportCost:   float
    installationCost:    float
    accessoryCost:       float
    otherInitialCost:    float
    equipmentSubtotal:   float
    profitMargin:        float
    profitAmount:        float
    sellingPrice:        float


class SimulationResult(BaseModel):
    solarFractionPct:       float
    lossOfLoadPct:          float
    curtailmentPct:         float
    mgDieselLiters:         int
    mgDieselHours:          int
    dieselOnlyLiters:       int
    dieselRunHoursA:        int
    annualFuelSavingLiters: int
    annualFuelSavingUsd:    float


class SummaryResult(BaseModel):
    projectName:           str
    analysisYears:         int
    annualLoadKwh:         float
    sellingPriceUsd:       float
    totalCostUsd:          float
    profitAmountUsd:       float
    mgAnnualOmUsd:         float
    mgAnnualFuelUsd:       float
    dieselAnnualFuelUsd:   float
    breakevenYear:         Optional[int]
    lcoeCrossoverYear:     Optional[int]
    finalMgLcoe:           float
    finalDieselLcoe:       float
    finalCumulativeRevenue: float


class ComparisonRow(BaseModel):
    year:              int
    mgAnnualCost:      float
    dieselAnnualCost:  float
    mgCumulative:      float
    dieselCumulative:  float
    mgLcoe:            float
    dieselLcoe:        float
    annualRevenue:     float
    cumulativeRevenue: float


class CalculateResponse(BaseModel):
    success:         bool
    simulated:       bool = False
    error:           Optional[str] = None
    systemConfig:    Optional[SystemConfigResult] = None
    capex:           Optional[CapexResult] = None
    simulation:      Optional[SimulationResult] = None
    summary:         Optional[SummaryResult] = None
    comparisonTable: Optional[list[ComparisonRow]] = None
