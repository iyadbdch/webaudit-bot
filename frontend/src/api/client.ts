import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'X-API-Key': localStorage.getItem('api_key') || '' },
});

api.interceptors.request.use((config) => {
  const key = localStorage.getItem('api_key');
  if (key) config.headers['X-API-Key'] = key;
  return config;
});

export interface Site {
  id: string;
  url: string;
  name: string;
  isActive: boolean;
  uptimeEnabled: boolean;
  changeEnabled: boolean;
  auditEnabled: boolean;
  lighthouseEnabled: boolean;
  uptimeInterval: number;
  changeInterval: number;
  auditInterval: number;
  lighthouseInterval: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  totalSites: number;
  activeSites: number;
  downSites: number;
  healthySites: number;
  changesToday: number;
  sites: DashboardSite[];
}

export interface DashboardSite {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  status: 'up' | 'down' | 'slow' | 'unknown';
  responseTime: number | null;
  uptimePercent: number;
  auditScore: number | null;
  lighthousePerf: number | null;
  lighthouseSeo: number | null;
  lastChecked: string | null;
  enabled: {
    uptime: boolean;
    change: boolean;
    audit: boolean;
    lighthouse: boolean;
  };
}

export interface UptimeLog {
  id: string;
  siteId: string;
  status: string;
  statusCode: number;
  responseTime: number;
  error: string | null;
  checkedAt: string;
}

export interface AuditResult {
  id: string;
  siteId: string;
  type: string;
  score: number | null;
  summary: string;
  passed: number;
  warnings: number;
  errors: number;
  ranAt: string;
}

export interface LighthouseReport {
  id: string;
  siteId: string;
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
  pwa: number | null;
  ranAt: string;
}

export interface ChangeLog {
  id: string;
  siteId: string;
  previousHash: string;
  newHash: string;
  diffSize: number;
  title: string;
  detectedAt: string;
}
