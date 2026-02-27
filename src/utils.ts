import { WagePeriod, Production } from './types';
import { WAGE_PERIODS, MAP_POS, WAGES } from './constants';

export function getISOWeek(d: Date) {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

export function calculateHours(start: string, end: string) {
  if (!start || !end) return 0;
  const s = new Date(`2000-01-01T${start}`);
  let e = new Date(`2000-01-01T${end}`);
  if (e < s) e.setDate(e.getDate() + 1);
  return (e.getTime() - s.getTime()) / (1000 * 60 * 60);
}

export function calculateOT(act: number, type: string) {
  let payable = 0;
  
  if (act <= 8) {
    payable = act;
  } else if (act <= 12) {
    payable = 8 + (act - 8) * 1.5;
  } else if (act <= 14) {
    payable = 14 + (act - 12) * 2;
  } else {
    payable = 18 + (act - 14) * 3;
  }

  if (type === '8hr') return Math.max(8, payable);
  if (type === '10hr') return Math.max(11, payable); // 8 + 2*1.5 = 11
  if (type === '12hr') return Math.max(14, payable); // 8 + 4*1.5 = 14
  
  return payable; // unknown or no minimum
}

export function formatCurr(n: number | string) {
  const val = typeof n === 'string' ? parseFloat(n) : n;
  return isNaN(val) ? '$0.00' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
}

export function getWeekKey(d: string) {
  const date = new Date(d + 'T12:00:00');
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
  return new Date(date.setDate(diff)).toISOString().split('T')[0];
}

export function getWeekDateRange(wKey: string) {
  const start = new Date(wKey + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', fmt)} - ${end.toLocaleDateString('en-US', fmt)}, ${end.getFullYear()}`;
}

export const parseDates = (dateStr: string) => {
  if (!dateStr || dateStr.includes('TBA')) return { start: new Date(8640000000000000), end: new Date(8640000000000000) };
  const parts = dateStr.split(' to ');
  return { start: new Date(parts[0]), end: new Date(parts[1] || parts[0]) };
};

export function parseCSVLine(text: string) {
  let res = [], q = false, cur = "";
  for (let char of text) {
    if (char === '"') q = !q;
    else if (char === ',' && !q) { res.push(cur); cur = ""; }
    else cur += char;
  }
  res.push(cur);
  return res.map(s => s.replace(/^"|"$/g, '').trim());
}

export function mapTierToStandard(rawTier: string) {
  if (!rawTier) return "Feature Films & Large-Scale Television";
  const t = rawTier.toLowerCase();
  
  if (t.includes('rumoured')) return "Rumoured";
  
  if (t.includes('feature') || t.includes('tier 1') || t.includes('tier a') || t.includes('large-scale')) return "Feature Films & Large-Scale Television";
  if (t.includes('network') || t.includes('mid-range') || t.includes('tier 2') || t.includes('tier b') || t.includes('pilot')) return "Network & HB SVOD Pilots / Mid-Range Series";
  if (t.includes('home video') || t.includes('cable long form') || t.includes('tier 3') || t.includes('tier c') || t.includes('lower tier')) return "Home Video, Cable Long Form, & Lower Tier HB SVOD";
  
  if (t.includes('1st season')) return "Syndicated & Cable TV Series (1st Season)";
  if (t.includes('2nd season')) return "Syndicated & Cable TV Series (2nd Season)";
  if (t.includes('3rd season')) return "Syndicated & Cable TV Series (3rd Season)";
  
  // Default fallback
  return "Feature Films & Large-Scale Television"; 
}

export function getCurrentRate(tier: string, roleName: string) {
  if(!tier || tier === 'Rumoured' || !roleName) return null;
  const stdTier = mapTierToStandard(tier);
  const stdRole = MAP_POS[roleName];
  if(!WAGES[stdTier] || !WAGES[stdTier][stdRole]) return null;

  const now = new Date();
  let periodIdx = 0;
  for (let p of WAGE_PERIODS) {
    if (now >= new Date(p.start) && now <= new Date(p.end)) {
      periodIdx = p.idx;
      break;
    }
  }
  return WAGES[stdTier][stdRole][periodIdx];
}
