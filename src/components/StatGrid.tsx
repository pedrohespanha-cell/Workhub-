import React, { useState } from 'react';
import { DashSettings } from '../types';
import { formatCurr } from '../utils';

interface StatGridProps {
  sourceData: any;
  dashSettings: DashSettings;
  isWeekHeader?: boolean;
}

export const StatGrid: React.FC<StatGridProps> = ({ sourceData, dashSettings, isWeekHeader = false }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const actualH = sourceData.actualHours ?? sourceData.actualH ?? sourceData.th ?? 0;
  const g = sourceData.gross ?? sourceData.g ?? sourceData.tg ?? 0;
  const n = sourceData.net ?? sourceData.n ?? sourceData.tn ?? 0;
  const p = sourceData.payableHours ?? sourceData.payableH ?? sourceData.tph ?? 0;
  const showsC = sourceData.shows instanceof Set ? sourceData.shows.size : (sourceData.sNames?.size ?? sourceData.shows ?? 0);
  const daysC = sourceData.days instanceof Set ? sourceData.days.size : (sourceData.days ?? 0);
  const expectedStraight = sourceData.expectedStraightPay || 0;
  const payMultiplier = expectedStraight ? g / expectedStraight : 0;
  const deductions = g - n;
  const deductionRate = g ? (deductions / g) * 100 : 0;

  const getTooltip = (label: string) => {
    switch(label) {
      case 'Earnings': return 'Total Gross and Net pay entered';
      case 'Deductions': return 'Total Deductions (Gross - Net) and Rate';
      case 'Hours': return 'Payable Hours (incl. guarantees & OT) vs Actual Hours worked';
      case 'Hourly Rates': return 'Effective Hourly Rates based on Actual Hours worked';
      case 'Pay Multiplier': return 'Actual Gross Pay vs Expected Straight Time Pay based on tier/role rates';
      case 'Averages': return 'Average Gross Pay per Week and Month';
      case 'Activity': return 'Total Days and Shows worked';
      default: return '';
    }
  };

  const TooltipWrapper = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div 
      className="relative"
      onMouseEnter={() => setActiveTooltip(label)}
      onMouseLeave={() => setActiveTooltip(null)}
      onClick={() => setActiveTooltip(activeTooltip === label ? null : label)}
    >
      {children}
      {activeTooltip === label && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded-lg shadow-xl text-center pointer-events-none animate-in fade-in zoom-in duration-200">
          {getTooltip(label)}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
        </div>
      )}
    </div>
  );

  if (isWeekHeader) {
    const dps: { label: string; val: string | number; type: string }[] = [];
    if (dashSettings.weekGross) dps.push({ label: 'Wk Gross', val: formatCurr(g), type: 'emerald' });
    if (dashSettings.weekNet) dps.push({ label: 'Wk Net', val: formatCurr(n), type: 'brand' });
    if (dashSettings.weekHourlyGross) dps.push({ label: 'Hourly Grs', val: formatCurr(actualH ? g / actualH : 0), type: 'normal' });
    if (dashSettings.weekHourlyNet) dps.push({ label: 'Hourly Net', val: formatCurr(actualH ? n / actualH : 0), type: 'normal' });
    if (dashSettings.weekShows) dps.push({ label: 'Shows', val: showsC, type: 'normal' });
    if (dashSettings.weekPayableHrs) dps.push({ label: 'Payable Hrs', val: p.toFixed(1), type: 'normal' });
    if (dashSettings.weekActualHrs) dps.push({ label: 'Actual Hrs', val: actualH.toFixed(1), type: 'normal' });

    return (
      <div className="flex gap-4 sm:gap-6 flex-wrap mt-2 md:mt-0 justify-start md:justify-end flex-1 pr-4">
        {dps.map((dp, i) => (
          <div key={i} className="text-left md:text-right flex-1 md:flex-none relative" title={getTooltip(dp.label)}>
            <p className="text-[9px] text-slate-400 font-black uppercase cursor-help">{dp.label}</p>
            <p className={`font-black ${dp.type === 'emerald' ? 'text-emerald-500' : dp.type === 'brand' ? 'text-brand-500' : 'text-slate-700 dark:text-slate-300'}`}>{dp.val}</p>
            {dp.label === 'Payable Hrs' && sourceData.hasMissingGuarantee && (
              <div className="absolute -top-1 -right-3 text-orange-500" title={`Missing guarantee for:\n${sourceData.missingGuarantees?.join('\n') || 'Some entries'}`}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {(dashSettings.gross || dashSettings.net) && (
        <TooltipWrapper label="Earnings">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest cursor-help mb-2">Earnings</p>
            <div className="flex justify-between items-end">
              {dashSettings.gross && (
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Gross</p>
                  <p className="text-xl font-black text-emerald-500">{formatCurr(g)}</p>
                </div>
              )}
              {dashSettings.net && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Net</p>
                  <p className="text-lg font-black text-brand-500">{formatCurr(n)}</p>
                </div>
              )}
            </div>
          </div>
        </TooltipWrapper>
      )}

      {(dashSettings.gross && dashSettings.net) && (
        <TooltipWrapper label="Deductions">
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest cursor-help mb-2">Deductions</p>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Amount</p>
                <p className="text-xl font-black text-rose-500">{formatCurr(deductions)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-500 uppercase">Rate</p>
                <p className="text-lg font-black text-slate-700 dark:text-slate-300">{deductionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </TooltipWrapper>
      )}

      {(dashSettings.payableHrs || dashSettings.actualHrs) && (
        <TooltipWrapper label="Hours">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col justify-between h-full relative">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest cursor-help mb-2">Hours</p>
            <div className="flex justify-between items-end">
              {dashSettings.payableHrs && (
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Payable</p>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100">{p.toFixed(1)}</p>
                </div>
              )}
              {dashSettings.actualHrs && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Actual</p>
                  <p className="text-lg font-black text-slate-600 dark:text-slate-400">{actualH.toFixed(1)}</p>
                </div>
              )}
            </div>
            {sourceData.hasMissingGuarantee && (
              <div className="absolute top-4 right-4 text-orange-500" title={`Missing guarantee for:\n${sourceData.missingGuarantees?.join('\n') || 'Some entries'}`}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              </div>
            )}
          </div>
        </TooltipWrapper>
      )}

      {(dashSettings.hourlyGross || dashSettings.hourlyNet) && (
        <TooltipWrapper label="Hourly Rates">
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest cursor-help mb-2">Hourly Rates</p>
            <div className="flex justify-between items-end">
              {dashSettings.hourlyGross && (
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">$/hr Grs</p>
                  <p className="text-xl font-black text-emerald-500/80">{formatCurr(actualH ? g / actualH : 0)}</p>
                </div>
              )}
              {dashSettings.hourlyNet && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">$/hr Net</p>
                  <p className="text-lg font-black text-brand-500/80">{formatCurr(actualH ? n / actualH : 0)}</p>
                </div>
              )}
            </div>
          </div>
        </TooltipWrapper>
      )}

      <TooltipWrapper label="Pay Multiplier">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest cursor-help mb-2">Pay Multiplier</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase">Multiplier</p>
              <p className="text-xl font-black text-amber-500">{payMultiplier.toFixed(2)}x</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Straight Pay</p>
              <p className="text-lg font-black text-slate-600 dark:text-slate-400">{formatCurr(expectedStraight)}</p>
            </div>
          </div>
        </div>
      </TooltipWrapper>

      {(dashSettings.avgPerWeek || dashSettings.avgPerMonth) && (
        <TooltipWrapper label="Averages">
          <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest cursor-help mb-2">Averages</p>
            <div className="flex justify-between items-end">
              {dashSettings.avgPerWeek && (
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Per Week</p>
                  <p className="text-xl font-black text-emerald-500/80">{formatCurr(sourceData.avgPerWeek || 0)}</p>
                </div>
              )}
              {dashSettings.avgPerMonth && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Per Month</p>
                  <p className="text-lg font-black text-brand-500/80">{formatCurr(sourceData.avgPerMonth || 0)}</p>
                </div>
              )}
            </div>
          </div>
        </TooltipWrapper>
      )}

      {(dashSettings.days || dashSettings.shows || dashSettings.weeksWorked) && (
        <TooltipWrapper label="Activity">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border dark:border-slate-800 shadow-sm flex flex-col justify-between h-full">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest cursor-help mb-2">Activity</p>
            <div className="flex justify-between items-end">
              {dashSettings.days && (
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Days</p>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-100">{daysC}</p>
                </div>
              )}
              {dashSettings.shows && (
                <div className="text-center">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Shows</p>
                  <p className="text-lg font-black text-slate-700 dark:text-slate-300">{showsC}</p>
                </div>
              )}
              {dashSettings.weeksWorked && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-500 uppercase">Weeks</p>
                  <p className="text-lg font-black text-slate-600 dark:text-slate-400">{sourceData.weeksWorked || 0}</p>
                </div>
              )}
            </div>
          </div>
        </TooltipWrapper>
      )}

      {dashSettings.pending && (sourceData.pending || 0) > 0 && (
        <div className="bg-orange-500/10 border-orange-500/30 p-4 rounded-3xl border shadow-sm flex flex-col justify-between h-full">
          <p className="text-[10px] uppercase font-black tracking-widest text-orange-600 dark:text-orange-500 mb-2">Pending</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] font-bold text-orange-600/70 dark:text-orange-500/70 uppercase">Cheques</p>
              <p className="text-xl font-black text-orange-600 dark:text-orange-500">{sourceData.pending}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
