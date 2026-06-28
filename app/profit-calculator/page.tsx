'use client'

import { useState, useCallback, useMemo } from "react";

// ============================================================
// PRICING ENGINE
// ============================================================
const PricingEngine = {
  calculateTotalProductCost(costs: { id: number; label: string; amount: string }[]) {
    return costs.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  },
  calculateMarketplaceFees(sellingPrice: number, feeRule: FeeRule) {
    const commission = sellingPrice * (feeRule.commission / 100);
    const transaction = sellingPrice * (feeRule.transaction / 100);
    const platform = sellingPrice * (feeRule.platform / 100);
    const payment = sellingPrice * (feeRule.payment / 100);
    return { commission, transaction, platform, payment, total: commission + transaction + platform + payment };
  },
  calculateMarketingCosts(sellingPrice: number, marketing: MarketingState) {
    let total = 0;
    const breakdown: Record<string, number> = {};
    Object.entries(marketing).forEach(([key, item]) => {
      if (!item.enabled) { breakdown[key] = 0; return; }
      const val = item.type === "percent" ? sellingPrice * (item.value / 100) : item.value;
      breakdown[key] = val;
      total += val;
    });
    return { total, breakdown };
  },
  calculate(sellingPrice: number, productCost: number, feeRule: FeeRule, marketing: MarketingState) {
    const mpFees = this.calculateMarketplaceFees(sellingPrice, feeRule);
    const mktCost = this.calculateMarketingCosts(sellingPrice, marketing);
    const totalCost = productCost + mpFees.total + mktCost.total;
    const netProfit = sellingPrice - totalCost;
    const margin = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;
    const roi = productCost > 0 ? (netProfit / productCost) * 100 : 0;
    const sellerPayout = sellingPrice - mpFees.total;
    const breakEven = totalCost;
    const recommended = totalCost * 1.20;
    const premium = totalCost * 1.35;
    return { netProfit, margin, roi, sellerPayout, totalCost, mpFees, mktCost, breakEven, recommended, premium };
  },
};

// ============================================================
// TYPES
// ============================================================
interface FeeRule {
  commission: number;
  transaction: number;
  platform: number;
  payment: number;
  source?: string;
  verified?: boolean;
  effectiveDate?: string;
}

interface MarketingItem {
  enabled: boolean;
  label: string;
  value: number;
  type: "percent" | "fixed";
}

type MarketingState = Record<string, MarketingItem>;

interface CostItem {
  id: number;
  label: string;
  amount: string;
}

interface SavedProduct {
  id: number;
  name: string;
  sku: string;
  platform: string;
  category: string;
  margin: number;
  profit: number;
  price: number;
}

interface AiAdvice {
  summary: string;
  rating: string;
  tips: string[];
  recommendedPrice: number;
  warning: string | null;
}

// ============================================================
// FEE DATABASE
// ============================================================
const FEE_DATABASE: Record<string, { name: string; categories: Record<string, FeeRule> }> = {
  shopee: {
    name: "Shopee Malaysia",
    categories: {
      "Fashion": { commission: 3.5, transaction: 2.0, platform: 0, payment: 1.5, source: "https://seller.shopee.com.my", verified: true, effectiveDate: "2024-01-01" },
      "Electronics": { commission: 3.0, transaction: 2.0, platform: 0, payment: 1.5, source: "https://seller.shopee.com.my", verified: true, effectiveDate: "2024-01-01" },
      "Health & Beauty": { commission: 4.0, transaction: 2.0, platform: 0, payment: 1.5, source: "https://seller.shopee.com.my", verified: true, effectiveDate: "2024-01-01" },
      "Home & Living": { commission: 3.5, transaction: 2.0, platform: 0, payment: 1.5, source: "https://seller.shopee.com.my", verified: true, effectiveDate: "2024-01-01" },
      "Food & Beverages": { commission: 5.0, transaction: 2.0, platform: 0, payment: 1.5, source: "https://seller.shopee.com.my", verified: true, effectiveDate: "2024-01-01" },
    }
  },
  tiktok: {
    name: "TikTok Shop Malaysia",
    categories: {
      "Fashion": { commission: 2.5, transaction: 1.8, platform: 0, payment: 1.0, source: "https://seller-my.tiktok.com", verified: true, effectiveDate: "2024-03-01" },
      "Electronics": { commission: 2.0, transaction: 1.8, platform: 0, payment: 1.0, source: "https://seller-my.tiktok.com", verified: true, effectiveDate: "2024-03-01" },
      "Health & Beauty": { commission: 3.0, transaction: 1.8, platform: 0, payment: 1.0, source: "https://seller-my.tiktok.com", verified: true, effectiveDate: "2024-03-01" },
      "Home & Living": { commission: 2.5, transaction: 1.8, platform: 0, payment: 1.0, source: "https://seller-my.tiktok.com", verified: true, effectiveDate: "2024-03-01" },
      "Food & Beverages": { commission: 4.0, transaction: 1.8, platform: 0, payment: 1.0, source: "https://seller-my.tiktok.com", verified: true, effectiveDate: "2024-03-01" },
    }
  }
};

const CATEGORIES = Object.keys(FEE_DATABASE.shopee.categories);

const DEFAULT_COSTS: CostItem[] = [
  { id: 1, label: "Product Cost", amount: "" },
  { id: 2, label: "Packaging", amount: "" },
  { id: 3, label: "Bubble Wrap", amount: "" },
  { id: 4, label: "Box", amount: "" },
  { id: 5, label: "Sticker", amount: "" },
  { id: 6, label: "Labour", amount: "" },
  { id: 7, label: "Management Fee", amount: "" },
  { id: 8, label: "Shipping Material", amount: "" },
  { id: 9, label: "Free Gift", amount: "" },
  { id: 10, label: "Other Cost", amount: "" },
];

const DEFAULT_MARKETING: MarketingState = {
  affiliate: { enabled: false, label: "Affiliate", value: 10, type: "percent" },
  gmvMax: { enabled: false, label: "GMV Max", value: 5, type: "percent" },
  ads: { enabled: false, label: "Marketplace Ads", value: 0, type: "fixed" },
  voucher: { enabled: false, label: "Voucher", value: 5, type: "percent" },
  coins: { enabled: false, label: "Coins Cashback", value: 1, type: "percent" },
  freeShipping: { enabled: false, label: "Free Shipping", value: 0, type: "fixed" },
  campaign: { enabled: false, label: "Campaign", value: 0, type: "fixed" },
};

const MOCK_SAVED: SavedProduct[] = [
  { id: 1, name: "Skincare Set Premium", sku: "SKN-001", platform: "shopee", category: "Health & Beauty", margin: 23.4, profit: 8.20, price: 35.90 },
  { id: 2, name: "Tudung Bawal Cotton", sku: "FAS-042", platform: "tiktok", category: "Fashion", margin: 31.2, profit: 12.50, price: 40.00 },
  { id: 3, name: "Air Fryer Mini 2L", sku: "ELC-019", platform: "shopee", category: "Electronics", margin: 18.7, profit: 28.00, price: 149.90 },
];

const rm = (v: number | string) => `RM${(parseFloat(String(v)) || 0).toFixed(2)}`;
const pct = (v: number | string) => `${(parseFloat(String(v)) || 0).toFixed(1)}%`;

// ============================================================
// CSS
// ============================================================
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', sans-serif;
    background: #F5F5F7;
    color: #1A1A2E;
    min-height: 100vh;
    font-size: 14px;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 2px; }

  .app { display: flex; min-height: 100vh; }

  .sidebar {
    width: 220px;
    min-height: 100vh;
    background: #C0000A;
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0; top: 0; bottom: 0;
    z-index: 100;
  }

  .sidebar-logo {
    padding: 20px 18px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.12);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-icon {
    width: 34px; height: 34px;
    background: white;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .logo-icon svg { width: 18px; height: 18px; }
  .logo-text { font-size: 14px; font-weight: 700; color: white; line-height: 1.2; }
  .logo-sub { font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 1px; }
  .sidebar-nav { padding: 12px 10px; flex: 1; overflow-y: auto; }

  .nav-section-label {
    font-size: 9px;
    font-weight: 700;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 10px 10px 5px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: 7px;
    cursor: pointer;
    color: rgba(255,255,255,0.7);
    font-size: 13px;
    font-weight: 500;
    transition: all 0.15s;
    margin-bottom: 1px;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }

  .nav-item:hover { background: rgba(255,255,255,0.1); color: white; }
  .nav-item.active { background: rgba(255,255,255,0.18); color: white; font-weight: 600; }
  .nav-item-icon { width: 16px; text-align: center; flex-shrink: 0; font-size: 14px; }

  .sidebar-footer {
    padding: 14px 16px;
    border-top: 1px solid rgba(255,255,255,0.12);
  }

  .sidebar-footer-text { font-size: 10px; color: rgba(255,255,255,0.45); line-height: 1.7; }
  .sidebar-footer-text strong { color: rgba(255,255,255,0.7); }

  .main { margin-left: 220px; flex: 1; display: flex; flex-direction: column; min-height: 100vh; }

  .topbar {
    height: 56px;
    background: white;
    border-bottom: 1px solid #E5E7EB;
    display: flex;
    align-items: center;
    padding: 0 24px;
    gap: 14px;
    position: sticky; top: 0; z-index: 50;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .topbar-hamburger {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    color: #6B7280; cursor: pointer; border-radius: 6px;
    border: none; background: none; font-size: 16px;
  }

  .topbar-search {
    flex: 1; max-width: 320px;
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 7px 12px 7px 32px;
    font-size: 13px;
    color: #374151;
    outline: none;
    font-family: 'Inter', sans-serif;
  }

  .topbar-search:focus { border-color: #C0000A; }
  .topbar-search::placeholder { color: #9CA3AF; }
  .topbar-search-wrap { position: relative; flex: 1; max-width: 320px; }
  .topbar-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9CA3AF; font-size: 12px; }
  .topbar-right { display: flex; align-items: center; gap: 8px; margin-left: auto; }

  .topbar-icon-btn {
    width: 34px; height: 34px;
    border-radius: 8px;
    border: 1px solid #E5E7EB;
    background: white;
    color: #6B7280;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.15s;
  }

  .topbar-icon-btn:hover { border-color: #C0000A; color: #C0000A; }

  .topbar-avatar {
    width: 34px; height: 34px;
    border-radius: 8px;
    background: linear-gradient(135deg, #C0000A, #FF4444);
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 13px; font-weight: 700;
    cursor: pointer;
  }

  .page-header { padding: 20px 24px 0; }
  .page-title { font-size: 22px; font-weight: 800; color: #111827; margin-bottom: 3px; }
  .page-sub { font-size: 13px; color: #6B7280; margin-bottom: 4px; }

  .breadcrumb {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #9CA3AF;
    padding: 12px 24px 0;
  }

  .breadcrumb-sep { color: #D1D5DB; }
  .breadcrumb-current { color: #C0000A; font-weight: 600; }
  .breadcrumb a { color: #6B7280; text-decoration: none; }

  .content { padding: 20px 24px 32px; }

  .card {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .card-title {
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-title-icon {
    width: 28px; height: 28px;
    background: #FEF2F2;
    border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px;
    color: #C0000A;
    flex-shrink: 0;
  }

  .card-sub { font-size: 12px; color: #9CA3AF; margin-top: 2px; font-weight: 400; }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    padding: 18px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    transition: box-shadow 0.15s;
  }

  .stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  .stat-label { font-size: 11px; color: #9CA3AF; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; }
  .stat-value { font-size: 24px; font-weight: 800; color: #111827; font-family: 'JetBrains Mono', monospace; }
  .stat-value.red { color: #C0000A; }
  .stat-value.green { color: #059669; }
  .stat-sub { font-size: 11px; color: #9CA3AF; margin-top: 5px; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 12px; font-weight: 600; color: #374151; }

  .form-input, .form-select {
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    color: #111827;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    padding: 9px 12px;
    outline: none;
    transition: all 0.15s;
    width: 100%;
  }

  .form-input:focus, .form-select:focus {
    border-color: #C0000A;
    background: white;
    box-shadow: 0 0 0 3px rgba(192,0,10,0.08);
  }

  .form-input::placeholder { color: #9CA3AF; }
  .form-input.mono { font-family: 'JetBrains Mono', monospace; }

  .cost-row {
    display: grid;
    grid-template-columns: 1fr 40px 120px 32px;
    gap: 8px;
    align-items: center;
    padding: 7px 0;
    border-bottom: 1px solid #F3F4F6;
  }

  .cost-row:last-child { border-bottom: none; }
  .cost-prefix { font-size: 12px; color: #9CA3AF; font-weight: 600; text-align: center; }

  .btn-del {
    width: 30px; height: 30px;
    border-radius: 6px;
    border: 1px solid #E5E7EB;
    background: white;
    color: #9CA3AF;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 300;
    transition: all 0.15s;
  }

  .btn-del:hover { border-color: #EF4444; color: #EF4444; background: #FEF2F2; }

  .total-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #FEF2F2;
    border: 1px solid #FECACA;
    border-radius: 8px;
    margin-top: 12px;
  }

  .total-bar-label { font-size: 13px; font-weight: 600; color: #374151; }
  .total-bar-value { font-family: 'JetBrains Mono', monospace; font-size: 17px; font-weight: 700; color: #C0000A; }

  .platform-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .platform-card {
    border: 2px solid #E5E7EB;
    border-radius: 10px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.15s;
    background: #F9FAFB;
  }

  .platform-card:hover { border-color: #D1D5DB; background: white; }
  .platform-card.selected { border-color: #C0000A; background: #FEF2F2; }

  .platform-name { font-size: 14px; font-weight: 700; color: #111827; margin: 8px 0 3px; }
  .platform-fee { font-size: 11px; color: #6B7280; }

  .toggle-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #F9FAFB;
    border-radius: 8px;
    border: 1px solid #E5E7EB;
    margin-bottom: 6px;
    transition: all 0.15s;
  }

  .toggle-row.active { border-color: #FECACA; background: #FEF2F2; }
  .toggle-label { font-size: 13px; color: #374151; font-weight: 500; flex: 1; }

  .toggle {
    width: 36px; height: 20px;
    background: #D1D5DB;
    border-radius: 10px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s;
    flex-shrink: 0;
    border: none;
  }

  .toggle.on { background: #C0000A; }

  .toggle::after {
    content: '';
    position: absolute;
    width: 14px; height: 14px;
    background: white;
    border-radius: 50%;
    top: 3px; left: 3px;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .toggle.on::after { transform: translateX(16px); }
  .mkt-inputs { display: flex; gap: 6px; align-items: center; }

  .type-seg {
    display: flex;
    background: white;
    border-radius: 6px;
    border: 1px solid #E5E7EB;
    overflow: hidden;
  }

  .type-seg button {
    padding: 5px 9px;
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
  }

  .type-seg button.active { background: #C0000A; color: white; }

  .target-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }

  .target-btn {
    padding: 11px;
    border-radius: 8px;
    border: 2px solid #E5E7EB;
    background: #F9FAFB;
    color: #6B7280;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Inter', sans-serif;
    text-align: center;
  }

  .target-btn.active { border-color: #C0000A; background: #FEF2F2; color: #C0000A; }

  .price-pills { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }

  .price-pill { border-radius: 10px; padding: 14px; text-align: center; }
  .price-pill.breakeven { background: #FEF2F2; border: 1px solid #FECACA; }
  .price-pill.recommended { background: #FEF2F2; border: 2px solid #C0000A; }
  .price-pill.premium { background: #F0FDF4; border: 1px solid #A7F3D0; }
  .price-pill-label { font-size: 10px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em; }
  .price-pill-value { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 800; margin-top: 3px; }
  .price-pill.breakeven .price-pill-value { color: #EF4444; }
  .price-pill.recommended .price-pill-value { color: #C0000A; }
  .price-pill.premium .price-pill-value { color: #059669; }

  .result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

  .result-item {
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 14px;
    transition: all 0.15s;
  }

  .result-item:hover { border-color: #FECACA; background: #FEF2F2; }
  .result-label { font-size: 11px; color: #6B7280; font-weight: 600; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.03em; }
  .result-value { font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 800; color: #111827; }
  .result-value.green { color: #059669; }
  .result-value.red { color: #EF4444; }
  .result-value.primary { color: #C0000A; }
  .result-value.orange { color: #D97706; }

  .fee-breakdown {
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 14px;
  }

  .fee-breakdown-title { font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
  .fee-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
  .fee-key { font-size: 12px; color: #6B7280; }
  .fee-val { font-size: 12px; font-family: 'JetBrains Mono', monospace; color: #374151; font-weight: 600; }
  .fee-total-row { display: flex; justify-content: space-between; padding-top: 8px; margin-top: 6px; border-top: 1px solid #E5E7EB; }
  .fee-total-key { font-size: 13px; font-weight: 700; color: #111827; }
  .fee-total-val { font-size: 14px; font-weight: 800; font-family: 'JetBrains Mono', monospace; color: #C0000A; }

  .sim-current { text-align: center; margin-bottom: 20px; padding: 20px; background: #FEF2F2; border-radius: 10px; border: 1px solid #FECACA; }
  .sim-price { font-family: 'JetBrains Mono', monospace; font-size: 40px; font-weight: 800; color: #C0000A; }
  .sim-label { font-size: 12px; color: #6B7280; margin-top: 3px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

  .price-slider {
    -webkit-appearance: none;
    width: 100%; height: 6px;
    border-radius: 3px;
    background: linear-gradient(to right, #C0000A var(--pct, 50%), #E5E7EB var(--pct, 50%));
    outline: none; cursor: pointer;
  }

  .price-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 22px; height: 22px;
    border-radius: 50%;
    background: white;
    border: 3px solid #C0000A;
    box-shadow: 0 2px 6px rgba(192,0,10,0.3);
    cursor: pointer;
  }

  .slider-labels { display: flex; justify-content: space-between; margin-top: 8px; }
  .slider-label { font-size: 11px; color: #9CA3AF; font-family: 'JetBrains Mono', monospace; }

  .btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 18px;
    border-radius: 8px;
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    font-family: 'Inter', sans-serif;
  }

  .btn-primary { background: #C0000A; color: white; box-shadow: 0 2px 8px rgba(192,0,10,0.25); }
  .btn-primary:hover { background: #A30008; box-shadow: 0 4px 14px rgba(192,0,10,0.35); transform: translateY(-1px); }
  .btn-outline { background: white; color: #374151; border: 1px solid #E5E7EB; }
  .btn-outline:hover { border-color: #C0000A; color: #C0000A; background: #FEF2F2; }
  .btn-success { background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0; }
  .btn-success:hover { background: #D1FAE5; }
  .btn-danger { background: #FEF2F2; color: #EF4444; border: 1px solid #FECACA; }
  .btn-danger:hover { background: #FEE2E2; }
  .btn-sm { padding: 6px 13px; font-size: 12px; }

  .ai-box {
    background: linear-gradient(135deg, #FEF2F2, #FFF7F7);
    border: 1px solid #FECACA;
    border-radius: 12px;
    padding: 18px;
    margin-bottom: 16px;
  }

  .ai-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .ai-dot { width: 7px; height: 7px; background: #C0000A; border-radius: 50%; animation: pulse 2s infinite; }
  .ai-badge { font-size: 11px; font-weight: 800; color: #C0000A; letter-spacing: 0.08em; }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.75); }
  }

  .ai-summary { font-size: 14px; color: #111827; font-weight: 600; margin-bottom: 10px; }
  .ai-tips { display: flex; flex-direction: column; gap: 6px; }

  .ai-tip {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 12px; color: #374151;
    padding: 7px 10px;
    background: white;
    border-radius: 7px;
    border: 1px solid #FECACA;
    border-left: 3px solid #C0000A;
  }

  .scenario-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

  .scenario-card {
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 10px;
    padding: 16px;
    transition: all 0.15s;
  }

  .scenario-card:hover { border-color: #FECACA; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
  .scenario-label { font-size: 10px; color: #C0000A; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
  .scenario-name { font-size: 13px; color: #111827; font-weight: 700; margin-bottom: 10px; }
  .scenario-divider { border: none; border-top: 1px solid #E5E7EB; margin: 8px 0; }
  .scenario-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; }
  .scenario-key { font-size: 11px; color: #6B7280; }
  .scenario-val { font-size: 12px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
  .scenario-val.green { color: #059669; }
  .scenario-val.red { color: #EF4444; }
  .scenario-val.primary { color: #C0000A; }

  .data-table { width: 100%; border-collapse: collapse; }

  .data-table th {
    font-size: 11px; font-weight: 700;
    color: #6B7280;
    text-align: left;
    padding: 10px 14px;
    background: #F9FAFB;
    border-bottom: 1px solid #E5E7EB;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .data-table th:first-child { border-radius: 8px 0 0 0; }
  .data-table th:last-child { border-radius: 0 8px 0 0; }
  .data-table td { font-size: 13px; color: #374151; padding: 12px 14px; border-bottom: 1px solid #F3F4F6; }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: #FEF2F2; }

  .badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11px; font-weight: 700;
    padding: 3px 9px; border-radius: 20px;
  }

  .badge-shopee { background: #FFF0EE; color: #EE4D2D; }
  .badge-tiktok { background: #F3F4F6; color: #111827; }
  .badge-verified { background: #ECFDF5; color: #059669; }
  .badge-warning { background: #FFFBEB; color: #D97706; }
  .badge-red { background: #FEF2F2; color: #C0000A; }

  .search-wrap { position: relative; }
  .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9CA3AF; font-size: 12px; }

  .search-input {
    background: #F9FAFB;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    color: #111827;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    padding: 8px 12px 8px 32px;
    outline: none; width: 220px;
    transition: all 0.15s;
  }

  .search-input:focus { border-color: #C0000A; background: white; }

  .monitor-item {
    display: flex; gap: 12px; align-items: flex-start;
    padding: 14px; background: #F9FAFB;
    border-radius: 8px; border: 1px solid #E5E7EB;
    margin-bottom: 8px; transition: all 0.15s;
  }

  .monitor-item:hover { border-color: #FECACA; background: #FEF2F2; }
  .monitor-dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 3px; flex-shrink: 0; }
  .monitor-dot.ok { background: #059669; }
  .monitor-dot.change { background: #D97706; animation: pulse 2s infinite; }
  .monitor-source { font-size: 13px; color: #111827; font-weight: 600; }
  .monitor-detail { font-size: 11px; color: #9CA3AF; margin-top: 2px; }

  .confidence-bar { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
  .confidence-track { height: 5px; background: #E5E7EB; border-radius: 3px; flex: 1; overflow: hidden; }
  .confidence-fill { height: 100%; border-radius: 3px; background: linear-gradient(to right, #C0000A, #EF4444); }
  .confidence-label { font-size: 10px; color: #6B7280; font-family: 'JetBrains Mono', monospace; width: 32px; text-align: right; font-weight: 600; }

  .admin-input {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 6px;
    color: #111827;
    font-size: 12px;
    font-family: 'JetBrains Mono', monospace;
    padding: 5px 8px;
    outline: none; width: 72px; text-align: right;
    transition: all 0.15s;
  }

  .admin-input:focus { border-color: #C0000A; box-shadow: 0 0 0 2px rgba(192,0,10,0.08); }

  .alert-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 13px;
  }

  .alert-bar.warning { background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E; }
  .alert-bar.info { background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF; }

  .quick-card {
    background: white;
    border: 1px solid #E5E7EB;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }

  .quick-card:hover { border-color: #C0000A; box-shadow: 0 4px 16px rgba(192,0,10,0.1); transform: translateY(-2px); }
  .quick-card-icon { font-size: 32px; margin-bottom: 12px; }
  .quick-card-title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 5px; }
  .quick-card-sub { font-size: 12px; color: #6B7280; line-height: 1.5; }

  .empty { text-align: center; padding: 48px 24px; }
  .empty-icon { font-size: 48px; margin-bottom: 14px; }
  .empty-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 6px; }
  .empty-sub { font-size: 13px; color: #6B7280; }

  .spinner { width: 14px; height: 14px; border: 2px solid #FECACA; border-top-color: #C0000A; border-radius: 50%; animation: spin 0.7s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .tabs { display: flex; gap: 2px; background: #F3F4F6; border-radius: 9px; padding: 3px; margin-bottom: 16px; }
  .tab { flex: 1; padding: 7px 14px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; color: #6B7280; background: none; border: none; transition: all 0.15s; font-family: 'Inter', sans-serif; }
  .tab.active { background: white; color: #C0000A; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

  hr { border: none; border-top: 1px solid #F3F4F6; margin: 14px 0; }

  @media (max-width: 900px) {
    .sidebar { width: 58px; }
    .logo-text, .logo-sub, .nav-item span:not(.nav-item-icon), .nav-section-label, .sidebar-footer-text { display: none; }
    .main { margin-left: 58px; }
    .stats-grid { grid-template-columns: 1fr 1fr; }
    .result-grid { grid-template-columns: 1fr 1fr; }
    .form-grid, .form-grid-3 { grid-template-columns: 1fr; }
    .price-pills { grid-template-columns: 1fr; }
    .scenario-grid { grid-template-columns: 1fr; }
    .platform-grid { grid-template-columns: 1fr; }
  }
`;

// ============================================================
// MAIN APP
// ============================================================
export default function ProfitCalculatorPage() {
  const [view, setView] = useState("dashboard");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<AiAdvice | null>(null);
  const [productInfo, setProductInfo] = useState({ name: "", sku: "", brand: "", category: "Health & Beauty", subCategory: "" });
  const [platform, setPlatform] = useState("shopee");
  const [costs, setCosts] = useState<CostItem[]>(DEFAULT_COSTS.map(c => ({ ...c })));
  const [marketing, setMarketing] = useState<MarketingState>({ ...DEFAULT_MARKETING });
  const [sellingPrice, setSellingPrice] = useState(35.90);
  const [profitTarget, setProfitTarget] = useState({ type: "percent", value: 20 });
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>(MOCK_SAVED);
  const [search, setSearch] = useState("");
  const [adminFees, setAdminFees] = useState(FEE_DATABASE);
  const [adminTab, setAdminTab] = useState("shopee");

  const feeRule = useMemo(() => adminFees[platform]?.categories?.[productInfo.category] || { commission: 3.5, transaction: 2.0, platform: 0, payment: 1.5 }, [platform, productInfo.category, adminFees]);
  const totalProductCost = useMemo(() => PricingEngine.calculateTotalProductCost(costs), [costs]);
  const result = useMemo(() => PricingEngine.calculate(sellingPrice, totalProductCost, feeRule, marketing), [sellingPrice, totalProductCost, feeRule, marketing]);

  const minSlider = useMemo(() => Math.max(totalProductCost * 0.8, 1), [totalProductCost]);
  const maxSlider = useMemo(() => Math.max(totalProductCost * 3, sellingPrice * 2, 100), [totalProductCost, sellingPrice]);
  const sliderPct = useMemo(() => Math.min(100, Math.max(0, ((sellingPrice - minSlider) / (maxSlider - minSlider)) * 100)), [sellingPrice, minSlider, maxSlider]);

  const scenarios = useMemo(() => {
    return [
      { label: "Scenario A", name: "Current Setting", mkt: marketing },
      { label: "Scenario B", name: "Affiliate OFF", mkt: { ...marketing, affiliate: { ...marketing.affiliate, enabled: false } } },
      { label: "Scenario C", name: "Voucher 10%", mkt: { ...marketing, voucher: { ...marketing.voucher, enabled: true, value: 10 } } },
      { label: "Scenario D", name: "GMV Max OFF", mkt: { ...marketing, gmvMax: { ...marketing.gmvMax, enabled: false } } },
    ].map(s => ({ ...s, result: PricingEngine.calculate(sellingPrice, totalProductCost, feeRule, s.mkt) }));
  }, [sellingPrice, totalProductCost, feeRule, marketing]);

  const fetchAiAdvice = useCallback(async () => {
    setAiLoading(true); setAiAdvice(null);
    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: productInfo.name || "Product",
          platform: platform === "shopee" ? "Shopee MY" : "TikTok Shop MY",
          category: productInfo.category,
          cost: totalProductCost,
          price: sellingPrice,
          profit: result.netProfit,
          margin: result.margin,
          roi: result.roi,
          mpFees: result.mpFees.total,
          affiliate: marketing.affiliate.enabled ? marketing.affiliate.value + "%" : "OFF",
          gmv: marketing.gmvMax.enabled ? marketing.gmvMax.value + "%" : "OFF",
        }),
      });
      const data = await res.json();
      setAiAdvice(data);
    } catch {
      setAiAdvice({ summary: "Analisis lengkap setelah semua kos diisi.", rating: "Fair", tips: ["Pastikan kos produk lengkap diisi.", "Semak fee marketplace terkini.", "Aktifkan marketing yang bersesuaian."], recommendedPrice: result.recommended, warning: null });
    }
    setAiLoading(false);
  }, [productInfo, platform, totalProductCost, sellingPrice, result, marketing]);

  const addCost = () => setCosts(p => [...p, { id: Date.now(), label: "Cost Item", amount: "" }]);
  const removeCost = (id: number) => setCosts(p => p.filter(c => c.id !== id));
  const updateCost = (id: number, f: keyof CostItem, v: string) => setCosts(p => p.map(c => c.id === id ? { ...c, [f]: v } : c));
  const toggleMkt = (k: string) => setMarketing(p => ({ ...p, [k]: { ...p[k], enabled: !p[k].enabled } }));
  const updateMkt = (k: string, f: string, v: string | number) => setMarketing(p => ({ ...p, [k]: { ...p[k], [f]: v } }));

  const saveProduct = () => {
    if (!productInfo.name) return;
    setSavedProducts(p => [{ id: Date.now(), name: productInfo.name, sku: productInfo.sku || "-", platform, category: productInfo.category, margin: result.margin, profit: result.netProfit, price: sellingPrice }, ...p]);
    setView("saved");
  };

  const filteredProducts = savedProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));
  const ratingColor: Record<string, string> = { Excellent: "#059669", Good: "#059669", Fair: "#D97706", Poor: "#EF4444", Loss: "#EF4444" };

  const NAV = [
    { section: "Dashboards", items: [{ key: "dashboard", icon: "◈", label: "Overview" }] },
    { section: "Apps", items: [
      { key: "calculator", icon: "🧮", label: "Calculator" },
      { key: "saved", icon: "📦", label: "Saved Products" },
      { key: "monitor", icon: "📡", label: "Fee Monitor" },
    ]},
    { section: "Admin", items: [{ key: "admin", icon: "⚙", label: "Fee Engine" }] },
    { section: "Coming Soon", items: [
      { key: null, icon: "🤖", label: "AI Generator", disabled: true },
      { key: null, icon: "📊", label: "Analytics", disabled: true },
      { key: null, icon: "🔗", label: "API Sync", disabled: true },
    ]},
  ];

  const PAGE_TITLES: Record<string, string> = { dashboard: "Overview", calculator: "Profit Calculator", saved: "Saved Products", monitor: "Fee Monitor", admin: "Fee Engine" };
  const PAGE_SUBS: Record<string, string> = { dashboard: "Your marketplace profit summary", calculator: "Calculate your real net profit before you sell", saved: "Manage and track all your product calculations", monitor: "Monitor official marketplace fee changes", admin: "Manage marketplace fee rules — no code required" };

  const Dashboard = () => (
    <>
      <div className="stats-grid">
        {[
          { label: "Total Products", value: savedProducts.length.toString(), sub: "Saved calculations" },
          { label: "Average Margin", value: pct(savedProducts.reduce((s, p) => s + p.margin, 0) / (savedProducts.length || 1)), sub: "Across all products", cls: "red" },
          { label: "Average Profit", value: rm(savedProducts.reduce((s, p) => s + p.profit, 0) / (savedProducts.length || 1)), sub: "Net per product", cls: "green" },
          { label: "Total Saved", value: savedProducts.length.toString(), sub: "All time" },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className={`stat-value ${s.cls || ""}`}>{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
        {[
          { icon: "🧮", title: "New Calculation", sub: "Calculate real profit before listing", action: () => setView("calculator") },
          { icon: "📡", title: "Fee Monitor", sub: "Check latest platform fee updates", action: () => setView("monitor") },
          { icon: "⚙", title: "Admin Panel", sub: "Edit fee rules without touching code", action: () => setView("admin") },
        ].map((q, i) => (
          <div key={i} className="quick-card" onClick={q.action}>
            <div className="quick-card-icon">{q.icon}</div>
            <div className="quick-card-title">{q.title}</div>
            <div className="quick-card-sub">{q.sub}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title"><span className="card-title-icon">📋</span>Recent Calculations</div>
            <div className="card-sub">Your latest product profit calculations</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setView("calculator")}>+ New Calculation</button>
        </div>
        {savedProducts.length === 0 ? (
          <div className="empty"><div className="empty-icon">📊</div><div className="empty-title">No calculations yet</div><div className="empty-sub">Create your first calculation to see profit insights here</div></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Product</th><th>Platform</th><th>Category</th><th>Price</th><th>Margin</th><th>Net Profit</th></tr></thead>
            <tbody>
              {savedProducts.slice(0, 5).map(p => (
                <tr key={p.id}>
                  <td><div style={{ fontWeight: 700, color: "#111827" }}>{p.name}</div><div style={{ fontSize: 11, color: "#9CA3AF" }}>{p.sku}</div></td>
                  <td><span className={`badge badge-${p.platform}`}>{p.platform === "shopee" ? "🛍️ Shopee" : "🎵 TikTok"}</span></td>
                  <td style={{ color: "#6B7280", fontSize: 12 }}>{p.category}</td>
                  <td><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{rm(p.price)}</span></td>
                  <td><span style={{ color: p.margin > 20 ? "#059669" : p.margin > 10 ? "#D97706" : "#EF4444", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{pct(p.margin)}</span></td>
                  <td><span style={{ color: p.profit > 0 ? "#059669" : "#EF4444", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{rm(p.profit)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const Calculator = () => (
    <>
      <div className="card">
        <div className="card-header"><div className="card-title"><span className="card-title-icon">📦</span>Basic Information</div></div>
        <div className="form-grid" style={{ marginBottom: 12 }}>
          <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" placeholder="e.g. Skincare Set Premium" value={productInfo.name} onChange={e => setProductInfo(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">SKU</label><input className="form-input" placeholder="e.g. SKN-001" value={productInfo.sku} onChange={e => setProductInfo(p => ({ ...p, sku: e.target.value }))} /></div>
        </div>
        <div className="form-grid-3">
          <div className="form-group"><label className="form-label">Brand</label><input className="form-input" placeholder="Brand" value={productInfo.brand} onChange={e => setProductInfo(p => ({ ...p, brand: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Category *</label><select className="form-select" value={productInfo.category} onChange={e => setProductInfo(p => ({ ...p, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Sub Category</label><input className="form-input" placeholder="e.g. Moisturiser" value={productInfo.subCategory} onChange={e => setProductInfo(p => ({ ...p, subCategory: e.target.value }))} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title"><span className="card-title-icon">🛒</span>Marketplace</div></div>
        <div className="platform-grid">
          {[
            { key: "shopee", icon: "🛍️", name: "Shopee Malaysia", fee: `Commission ${adminFees.shopee.categories[productInfo.category]?.commission || 3.5}%` },
            { key: "tiktok", icon: "🎵", name: "TikTok Shop Malaysia", fee: `Commission ${adminFees.tiktok.categories[productInfo.category]?.commission || 2.5}%` },
          ].map(p => (
            <div key={p.key} className={`platform-card ${platform === p.key ? "selected" : ""}`} onClick={() => setPlatform(p.key)}>
              <div style={{ fontSize: 28 }}>{p.icon}</div>
              <div className="platform-name">{p.name}</div>
              <div className="platform-fee">{p.fee} · From database</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="fee-breakdown">
            <div className="fee-breakdown-title">Fee Rules — {productInfo.category}</div>
            <div className="fee-row"><span className="fee-key">Commission</span><span className="fee-val">{feeRule.commission}%</span></div>
            <div className="fee-row"><span className="fee-key">Transaction</span><span className="fee-val">{feeRule.transaction}%</span></div>
            <div className="fee-row"><span className="fee-key">Platform</span><span className="fee-val">{feeRule.platform}%</span></div>
            <div className="fee-row"><span className="fee-key">Payment</span><span className="fee-val">{feeRule.payment}%</span></div>
            <div className="fee-total-row"><span className="fee-total-key">Total Fee</span><span className="fee-total-val">{(feeRule.commission + feeRule.transaction + feeRule.platform + feeRule.payment).toFixed(1)}%</span></div>
          </div>
          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>At Price {rm(sellingPrice)}</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 800, color: "#C0000A" }}>{rm(result.mpFees.total)}</div>
            <div style={{ fontSize: 11, color: "#6B7280", marginTop: 3 }}>Total marketplace fees</div>
            <div style={{ fontSize: 11, color: "#059669", marginTop: 6, fontWeight: 600 }}>✓ {feeRule.source?.replace("https://", "")}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">💰</span>Product Cost</div>
          <button className="btn btn-outline btn-sm" onClick={addCost}>+ Add Cost</button>
        </div>
        {costs.map(c => (
          <div key={c.id} className="cost-row">
            <input className="form-input" style={{ fontSize: 13 }} value={c.label} onChange={e => updateCost(c.id, "label", e.target.value)} />
            <span className="cost-prefix">RM</span>
            <input className="form-input mono" placeholder="0.00" value={c.amount} onChange={e => updateCost(c.id, "amount", e.target.value)} type="number" min="0" step="0.01" />
            <button className="btn-del" onClick={() => removeCost(c.id)}>×</button>
          </div>
        ))}
        <div className="total-bar">
          <span className="total-bar-label">Total Product Cost</span>
          <span className="total-bar-value">{rm(totalProductCost)}</span>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title"><span className="card-title-icon">📣</span>Marketing Cost</div></div>
        {Object.entries(marketing).map(([k, item]) => (
          <div key={k} className={`toggle-row ${item.enabled ? "active" : ""}`}>
            <button className={`toggle ${item.enabled ? "on" : ""}`} onClick={() => toggleMkt(k)} />
            <span className="toggle-label">{item.label}</span>
            {item.enabled && (
              <div className="mkt-inputs">
                <div className="type-seg">
                  <button className={item.type === "percent" ? "active" : ""} onClick={() => updateMkt(k, "type", "percent")}>%</button>
                  <button className={item.type === "fixed" ? "active" : ""} onClick={() => updateMkt(k, "type", "fixed")}>RM</button>
                </div>
                <input className="form-input mono" style={{ width: 80 }} type="number" min="0" step="0.1" value={item.value} onChange={e => updateMkt(k, "value", parseFloat(e.target.value) || 0)} />
                <span style={{ fontSize: 11, color: "#6B7280", width: 64, textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
                  {item.type === "percent" ? rm(sellingPrice * item.value / 100) : "fixed"}
                </span>
              </div>
            )}
          </div>
        ))}
        {result.mktCost.total > 0 && (
          <div className="total-bar" style={{ marginTop: 10, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <span className="total-bar-label">Total Marketing Cost</span>
            <span className="total-bar-value" style={{ color: "#D97706" }}>{rm(result.mktCost.total)}</span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title"><span className="card-title-icon">🎯</span>Profit Target</div></div>
        <div className="target-grid">
          <button className={`target-btn ${profitTarget.type === "percent" ? "active" : ""}`} onClick={() => setProfitTarget(p => ({ ...p, type: "percent" }))}>Profit %</button>
          <button className={`target-btn ${profitTarget.type === "fixed" ? "active" : ""}`} onClick={() => setProfitTarget(p => ({ ...p, type: "fixed" }))}>Profit RM</button>
        </div>
        <input className="form-input mono" type="number" min="0" step="0.5" value={profitTarget.value} onChange={e => setProfitTarget(p => ({ ...p, value: parseFloat(e.target.value) || 0 }))} placeholder={profitTarget.type === "percent" ? "e.g. 20" : "e.g. 5.00"} />
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title"><span className="card-title-icon">🏷️</span>Selling Price</div></div>
        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Enter Selling Price (RM)</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 700, color: "#9CA3AF" }}>RM</span>
            <input className="form-input mono" style={{ fontSize: 24, fontWeight: 800, padding: "10px 14px" }} type="number" min="0" step="0.10" value={sellingPrice} onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div className="price-pills">
          <div className="price-pill breakeven"><div className="price-pill-label">Break Even</div><div className="price-pill-value">{rm(result.breakEven)}</div></div>
          <div className="price-pill recommended"><div className="price-pill-label">⭐ Recommended</div><div className="price-pill-value">{rm(result.recommended)}</div></div>
          <div className="price-pill premium"><div className="price-pill-label">Premium</div><div className="price-pill-value">{rm(result.premium)}</div></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title"><span className="card-title-icon">📊</span>Calculation Results</div>
            <div className="card-sub">AI-powered profit analysis</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={fetchAiAdvice} disabled={aiLoading}>
            {aiLoading ? <><div className="spinner" />Analysing...</> : "✨ AI Advisor"}
          </button>
        </div>

        <div className="result-grid" style={{ marginBottom: 14 }}>
          {[
            { label: "Net Profit", value: rm(result.netProfit), cls: result.netProfit >= 0 ? "green" : "red" },
            { label: "Profit Margin", value: pct(result.margin), cls: result.margin >= 15 ? "green" : result.margin >= 5 ? "orange" : "red" },
            { label: "ROI", value: pct(result.roi), cls: result.roi >= 20 ? "green" : result.roi >= 0 ? "orange" : "red" },
            { label: "Seller Payout", value: rm(result.sellerPayout), cls: "primary" },
            { label: "Marketplace Fees", value: rm(result.mpFees.total), cls: "red" },
            { label: "Total Cost", value: rm(result.totalCost), cls: "" },
          ].map((r, i) => (
            <div key={i} className="result-item">
              <div className="result-label">{r.label}</div>
              <div className={`result-value ${r.cls}`}>{r.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="fee-breakdown">
            <div className="fee-breakdown-title">Marketplace Fee Detail</div>
            <div className="fee-row"><span className="fee-key">Commission ({feeRule.commission}%)</span><span className="fee-val">{rm(result.mpFees.commission)}</span></div>
            <div className="fee-row"><span className="fee-key">Transaction ({feeRule.transaction}%)</span><span className="fee-val">{rm(result.mpFees.transaction)}</span></div>
            <div className="fee-row"><span className="fee-key">Payment ({feeRule.payment}%)</span><span className="fee-val">{rm(result.mpFees.payment)}</span></div>
            <div className="fee-total-row"><span className="fee-total-key">Total Fees</span><span className="fee-total-val">{rm(result.mpFees.total)}</span></div>
          </div>
          <div className="fee-breakdown">
            <div className="fee-breakdown-title">Full Cost Breakdown</div>
            <div className="fee-row"><span className="fee-key">Product Cost</span><span className="fee-val">{rm(totalProductCost)}</span></div>
            <div className="fee-row"><span className="fee-key">Marketplace Fees</span><span className="fee-val">{rm(result.mpFees.total)}</span></div>
            <div className="fee-row"><span className="fee-key">Marketing</span><span className="fee-val">{rm(result.mktCost.total)}</span></div>
            <div className="fee-total-row"><span className="fee-total-key">Total Cost</span><span className="fee-total-val">{rm(result.totalCost)}</span></div>
          </div>
        </div>
      </div>

      {aiAdvice && (
        <div className="ai-box">
          <div className="ai-header">
            <div className="ai-dot" />
            <span className="ai-badge">AI ADVISOR</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: ratingColor[aiAdvice.rating] || "#D97706", marginLeft: "auto", padding: "2px 10px", background: "white", borderRadius: 20, border: "1px solid #E5E7EB" }}>{aiAdvice.rating}</span>
          </div>
          <div className="ai-summary">{aiAdvice.summary}</div>
          {aiAdvice.warning && <div style={{ padding: "8px 12px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 7, fontSize: 12, color: "#92400E", marginBottom: 10 }}>⚠️ {aiAdvice.warning}</div>}
          <div className="ai-tips">
            {aiAdvice.tips?.map((tip, i) => <div key={i} className="ai-tip"><span>→</span><span>{tip}</span></div>)}
          </div>
          {aiAdvice.recommendedPrice > 0 && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, paddingTop: 12, borderTop: "1px solid #FECACA" }}>
              <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>AI Recommended Price:</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 18, fontWeight: 800, color: "#C0000A" }}>{rm(aiAdvice.recommendedPrice)}</span>
              <button className="btn btn-primary btn-sm" onClick={() => setSellingPrice(aiAdvice!.recommendedPrice)}>Apply</button>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-header"><div className="card-title"><span className="card-title-icon">🎚️</span>Price Simulator</div></div>
        <div className="sim-current">
          <div className="sim-price">{rm(sellingPrice)}</div>
          <div className="sim-label">Simulated Selling Price</div>
        </div>
        <input type="range" className="price-slider" style={{ "--pct": `${sliderPct}%` } as React.CSSProperties} min={minSlider} max={maxSlider} step={0.10} value={sellingPrice} onChange={e => setSellingPrice(parseFloat(e.target.value))} />
        <div className="slider-labels"><span className="slider-label">{rm(minSlider)}</span><span className="slider-label">{rm(maxSlider)}</span></div>
        <div className="result-grid" style={{ marginTop: 16 }}>
          {[
            { label: "Net Profit", value: rm(result.netProfit), cls: result.netProfit >= 0 ? "green" : "red" },
            { label: "Margin", value: pct(result.margin), cls: result.margin >= 15 ? "green" : "orange" },
            { label: "ROI", value: pct(result.roi), cls: result.roi >= 20 ? "green" : "orange" },
            { label: "MP Fee", value: rm(result.mpFees.total), cls: "red" },
            { label: "Seller Payout", value: rm(result.sellerPayout), cls: "primary" },
            { label: "Total Cost", value: rm(result.totalCost), cls: "" },
          ].map((r, i) => <div key={i} className="result-item"><div className="result-label">{r.label}</div><div className={`result-value ${r.cls}`}>{r.value}</div></div>)}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title"><span className="card-title-icon">⚡</span>Scenario Comparison</div></div>
        <div className="scenario-grid">
          {scenarios.map((s, i) => (
            <div key={i} className="scenario-card">
              <div className="scenario-label">{s.label}</div>
              <div className="scenario-name">{s.name}</div>
              <hr className="scenario-divider" />
              <div className="scenario-row"><span className="scenario-key">Net Profit</span><span className={`scenario-val ${s.result.netProfit >= 0 ? "green" : "red"}`}>{rm(s.result.netProfit)}</span></div>
              <div className="scenario-row"><span className="scenario-key">Margin</span><span className="scenario-val" style={{ color: s.result.margin >= 15 ? "#059669" : "#D97706" }}>{pct(s.result.margin)}</span></div>
              <div className="scenario-row"><span className="scenario-key">ROI</span><span className="scenario-val" style={{ color: s.result.roi >= 20 ? "#059669" : "#D97706" }}>{pct(s.result.roi)}</span></div>
              <div className="scenario-row"><span className="scenario-key">MP Fee</span><span className="scenario-val red">{rm(s.result.mpFees.total)}</span></div>
              <div className="scenario-row"><span className="scenario-key">Marketing</span><span className="scenario-val red">{rm(s.result.mktCost.total)}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={saveProduct}>💾 Save Product</button>
        <button className="btn btn-outline" onClick={() => { setCosts(DEFAULT_COSTS.map(c => ({ ...c }))); setMarketing({ ...DEFAULT_MARKETING }); setProductInfo({ name: "", sku: "", brand: "", category: "Health & Beauty", subCategory: "" }); setSellingPrice(35.90); setAiAdvice(null); }}>🔄 Reset</button>
      </div>
    </>
  );

  const Saved = () => (
    <div className="card">
      <div className="card-header">
        <div className="card-title"><span className="card-title-icon">📦</span>Saved Products</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setView("calculator")}>+ New</button>
        </div>
      </div>
      {filteredProducts.length === 0 ? (
        <div className="empty"><div className="empty-icon">📦</div><div className="empty-title">No products found</div><div className="empty-sub">Try a different search or create a new product</div></div>
      ) : (
        <table className="data-table">
          <thead><tr><th>Product</th><th>Platform</th><th>Category</th><th>Price</th><th>Margin</th><th>Profit</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id}>
                <td><div style={{ fontWeight: 700, color: "#111827" }}>{p.name}</div><div style={{ fontSize: 11, color: "#9CA3AF" }}>{p.sku}</div></td>
                <td><span className={`badge badge-${p.platform}`}>{p.platform === "shopee" ? "🛍️ Shopee" : "🎵 TikTok"}</span></td>
                <td style={{ color: "#6B7280", fontSize: 12 }}>{p.category}</td>
                <td><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{rm(p.price)}</span></td>
                <td><span style={{ color: p.margin > 20 ? "#059669" : p.margin > 10 ? "#D97706" : "#EF4444", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{pct(p.margin)}</span></td>
                <td><span style={{ color: p.profit > 0 ? "#059669" : "#EF4444", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{rm(p.profit)}</span></td>
                <td><div style={{ display: "flex", gap: 4 }}>
                  <button className="btn btn-outline btn-sm">Edit</button>
                  <button className="btn btn-outline btn-sm">Clone</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setSavedProducts(p2 => p2.filter(x => x.id !== p.id))}>Del</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const Monitor = () => (
    <>
      <div className="alert-bar warning">⚠️ Fee monitoring scans official sources only. Admin approval required before any database update.</div>
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">📡</span>Monitoring Sources</div>
          <button className="btn btn-primary btn-sm">🔄 Scan Now</button>
        </div>
        {[
          { status: "ok", source: "Shopee Seller Education Hub", url: "seller.shopee.com.my/edu", lastCheck: "2 hours ago", confidence: 98 },
          { status: "ok", source: "Shopee Official Announcement", url: "seller.shopee.com.my", lastCheck: "2 hours ago", confidence: 97 },
          { status: "change", source: "TikTok Shop Academy MY", url: "seller-my.tiktok.com/academy", lastCheck: "45 min ago", confidence: 91, change: "New affiliate commission structure detected" },
          { status: "ok", source: "TikTok Seller Centre MY", url: "seller-my.tiktok.com", lastCheck: "1 hour ago", confidence: 95 },
        ].map((m, i) => (
          <div key={i} className="monitor-item">
            <div className={`monitor-dot ${m.status}`} />
            <div style={{ flex: 1 }}>
              <div className="monitor-source">{m.source}</div>
              <div className="monitor-detail">{m.url} · Checked {m.lastCheck}</div>
              {m.change && <div style={{ fontSize: 12, color: "#D97706", marginTop: 4, fontWeight: 600 }}>⚡ {m.change}</div>}
              <div className="confidence-bar">
                <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600 }}>Confidence</span>
                <div className="confidence-track"><div className="confidence-fill" style={{ width: `${m.confidence}%` }} /></div>
                <span className="confidence-label">{m.confidence}%</span>
              </div>
            </div>
            <span className={`badge ${m.status === "ok" ? "badge-verified" : "badge-warning"}`}>{m.status === "ok" ? "✓ Up to date" : "⚡ Change"}</span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title"><span className="card-title-icon">📋</span>Change Report — Pending Admin Approval</div></div>
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 14 }}>⚡ Potential Fee Change Detected</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
            {[{ l: "Platform", v: "TikTok Shop MY" }, { l: "Category", v: "Fashion" }, { l: "Effective", v: "2024-04-01" }, { l: "Confidence", v: "91%" }].map((f, i) => (
              <div key={i}><div style={{ fontSize: 10, color: "#6B7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{f.l}</div><div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{f.v}</div></div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ background: "#FEF2F2", borderRadius: 8, padding: 14, textAlign: "center", border: "1px solid #FECACA" }}>
              <div style={{ fontSize: 10, color: "#EF4444", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Old Fee</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#EF4444", fontFamily: "'JetBrains Mono',monospace" }}>2.5%</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>Commission</div>
            </div>
            <div style={{ background: "#ECFDF5", borderRadius: 8, padding: 14, textAlign: "center", border: "1px solid #A7F3D0" }}>
              <div style={{ fontSize: 10, color: "#059669", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>New Fee</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#059669", fontFamily: "'JetBrains Mono',monospace" }}>3.0%</div>
              <div style={{ fontSize: 11, color: "#6B7280" }}>Commission</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-success btn-sm">✓ Approve & Update</button>
            <button className="btn btn-danger btn-sm">✗ Reject</button>
            <button className="btn btn-outline btn-sm">🔗 Verify Source</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#6B7280" }}>⚠️ Database will NOT be updated until admin approves.</div>
        </div>
      </div>
    </>
  );

  const Admin = () => (
    <>
      <div className="card">
        <div className="card-header">
          <div className="card-title"><span className="card-title-icon">⚙</span>Fee Engine — Live Database</div>
          <button className="btn btn-primary btn-sm">💾 Save All Changes</button>
        </div>
        <div className="tabs">
          <button className={`tab ${adminTab === "shopee" ? "active" : ""}`} onClick={() => setAdminTab("shopee")}>🛍️ Shopee Malaysia</button>
          <button className={`tab ${adminTab === "tiktok" ? "active" : ""}`} onClick={() => setAdminTab("tiktok")}>🎵 TikTok Shop Malaysia</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Category</th><th>Commission %</th><th>Transaction %</th><th>Platform %</th><th>Payment %</th><th>Total</th><th>Source</th><th>Status</th></tr></thead>
          <tbody>
            {Object.entries(adminFees[adminTab].categories).map(([cat, rule]) => (
              <tr key={cat}>
                <td style={{ fontWeight: 700, color: "#111827" }}>{cat}</td>
                {(["commission", "transaction", "platform", "payment"] as (keyof FeeRule)[]).map(f => (
                  <td key={String(f)}>
                    <input className="admin-input" type="number" min="0" step="0.1" value={rule[f] as number}
                      onChange={e => setAdminFees(p => ({ ...p, [adminTab]: { ...p[adminTab], categories: { ...p[adminTab].categories, [cat]: { ...rule, [f]: parseFloat(e.target.value) || 0 } } } }))}
                    />
                  </td>
                ))}
                <td><span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 800, color: "#C0000A" }}>{(rule.commission + rule.transaction + rule.platform + rule.payment).toFixed(1)}%</span></td>
                <td><a href={rule.source} target="_blank" rel="noreferrer" style={{ color: "#C0000A", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>Source ↗</a></td>
                <td><span className="badge badge-verified">{rule.verified ? "✓ Verified" : "Pending"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title"><span className="card-title-icon">📜</span>Fee Change History</div></div>
        <table className="data-table">
          <thead><tr><th>Date</th><th>Platform</th><th>Category</th><th>Field</th><th>Old Value</th><th>New Value</th><th>Admin</th></tr></thead>
          <tbody>
            <tr><td>2024-03-01</td><td><span className="badge badge-tiktok">TikTok Shop MY</span></td><td>Fashion</td><td>Commission</td><td style={{ color: "#EF4444", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>2.0%</td><td style={{ color: "#059669", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>2.5%</td><td style={{ color: "#6B7280" }}>admin@domain.com</td></tr>
            <tr><td>2024-01-15</td><td><span className="badge badge-shopee">Shopee MY</span></td><td>Food & Beverages</td><td>Commission</td><td style={{ color: "#EF4444", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>4.5%</td><td style={{ color: "#059669", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>5.0%</td><td style={{ color: "#6B7280" }}>admin@domain.com</td></tr>
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#C0000A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <div className="logo-text">ProfitCalc</div>
              <div className="logo-sub">Malaysia Sellers</div>
            </div>
          </div>
          <nav className="sidebar-nav">
            {NAV.map((section, si) => (
              <div key={si}>
                <div className="nav-section-label">{section.section}</div>
                {section.items.map((item, ii) => (
                  <button key={ii} className={`nav-item ${view === item.key ? "active" : ""}`}
                    onClick={() => item.key && setView(item.key)}
                    style={(item as { disabled?: boolean }).disabled ? { opacity: 0.4, cursor: "not-allowed" } : {}}
                  >
                    <span className="nav-item-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    {(item as { disabled?: boolean }).disabled && <span style={{ fontSize: 9, marginLeft: "auto", background: "rgba(255,255,255,0.15)", padding: "1px 5px", borderRadius: 3 }}>SOON</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="sidebar-footer-text">
              <strong>Database: Live</strong><br />
              Shopee MY ✓<br />
              TikTok Shop MY ✓
            </div>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <button className="topbar-hamburger">☰</button>
            <div className="topbar-search-wrap">
              <span className="topbar-search-icon">🔍</span>
              <input className="topbar-search" placeholder="Search..." />
            </div>
            <div className="topbar-right">
              <button className="topbar-icon-btn">⚙</button>
              <button className="topbar-icon-btn">🔔</button>
              <button className="topbar-icon-btn">🛒</button>
              <div className="topbar-avatar">P</div>
            </div>
          </div>

          <div className="breadcrumb">
            <a href="#">Dashboard</a>
            <span className="breadcrumb-sep">›</span>
            {view !== "dashboard" && <><a href="#" onClick={e => { e.preventDefault(); setView("dashboard"); }}>Overview</a><span className="breadcrumb-sep">›</span></>}
            <span className="breadcrumb-current">{PAGE_TITLES[view]}</span>
          </div>

          <div className="page-header">
            <div className="page-title">{PAGE_TITLES[view]}</div>
            <div className="page-sub">{PAGE_SUBS[view]}</div>
          </div>

          <div className="content">
            {view === "dashboard" && <Dashboard />}
            {view === "calculator" && <Calculator />}
            {view === "saved" && <Saved />}
            {view === "monitor" && <Monitor />}
            {view === "admin" && <Admin />}
          </div>
        </div>
      </div>
    </>
  );
}
