"""
schemas/optimize.py — /api/optimize 请求 & 响应模型
"""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class OptimizeRequest(BaseModel):
    annualLoadKwh:           float
    peakLoadKw:              float = 0.0
    peakSunHours:            float = 4.5
    storageDays:             int   = 1
    dieselPriceUsdPerLiter:  float = 0.95
    dieselIsNew:             bool  = False
    panelModel:              str   = "655W"
    bracketModel:            str   = "standard_32"
    batteryPackModel:        str   = "LFP-16kWh"
    minBracketSets:          int   = 1
    maxBracketSets:          int   = 8
    objective:               str   = "payback"
    availableAreaM2:         Optional[float] = None
    existingDieselKw:        Optional[float] = None


class OptimizeOption(BaseModel):
    bracketSets:              int
    pvKw:                     float
    batteryKwh:               float
    numPacks:                 int
    dieselKw:                 float
    solarFractionPct:         float
    annualDieselLiters:       int
    annualDieselOnlyLiters:   int
    capexUsd:                 float
    sellingPriceUsd:          float
    annualDieselCostUsd:      float
    annualDieselOnlyCostUsd:  float
    annualOmCostUsd:          float
    annualSavingsUsd:         float
    paybackYears:             float
    npv10yrUsd:               float
    lcoeMicrogridUsd:         float
    lcoeDieselOnlyUsd:        float
    label:                    str
    isRecommended:            bool
    isRunnerUp:               bool
    isThird:                  bool
    dieselIsNew:              bool


class OptimizeResponse(BaseModel):
    success:         bool
    dieselKw:        Optional[float] = None
    maxSetsAllowed:  Optional[int]   = None
    options:         Optional[list[OptimizeOption]] = None
    error:           Optional[str]   = None
