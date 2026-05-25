import { useParams, useNavigate } from 'react-router-dom';
import {
  useSite, useUptimeLogs, useAudits, useLighthouse, useChanges,
  useRunUptimeCheck, useRunAudit, useRunLighthouse, useUpdateSite,
} from '../api/hooks';
import { BentoCard } from '../components/BentoCard';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon, SignalFull02Icon, Analytics01Icon,
  DatabaseLightningIcon, AlarmClockIcon, ChartBarLineIcon,
  PlayIcon, Settings01Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function Icon({ icon, size = 18 }: { icon: IconSvgElement; size?: number }) {
  return <HugeiconsIcon icon={icon} size={size} />;
}

export default function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: site, isLoading } = useSite(id!);
  const { data: uptimeLogs } = useUptimeLogs(id!);
  const { data: audits } = useAudits(id!);
  const { data: lhReports } = useLighthouse(id!);
  const { data: changes } = useChanges(id!);
  const runUptime = useRunUptimeCheck();
  const runAudit = useRunAudit();
  const runLighthouse = useRunLighthouse();
  const updateSite = useUpdateSite();

  if (isLoading) return <div className="text-[#7a7a8a]">Loading...</div>;
  if (!site) return <div className="text-[#7a7a8a]">Site not found</div>;

  const uptimeChartData = uptimeLogs?.slice().reverse().map((log) => ({
    time: new Date(log.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    responseTime: log.responseTime || 0,
  })) || [];

  const auditChartData = audits?.slice().reverse().map((a) => ({
    date: new Date(a.ranAt).toLocaleDateString(),
    score: a.score || 0,
  })) || [];

  const lhData = lhReports?.[0];
  const latestAudit = audits?.[0];
  const latestChange = changes?.[0];

  const uptimeStats = uptimeLogs?.length
    ? {
        total: uptimeLogs.length,
        up: uptimeLogs.filter((l) => l.status === 'up').length,
        down: uptimeLogs.filter((l) => l.status === 'down').length,
        pct: Math.round((uptimeLogs.filter((l) => l.status === 'up').length / uptimeLogs.length) * 100),
      }
    : null;

  return (
    <div>
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-[#7a7a8a] hover:text-white mb-6 transition-colors">
        <Icon icon={ArrowLeft01Icon} size={16} />
        Back to Dashboard
      </button>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${site.isActive ? 'bg-emerald-500' : 'bg-[#3a3a4a]'}`} />
          <div>
            <h1 className="text-2xl font-bold text-white">{site.name}</h1>
            <p className="text-sm text-[#5a5a6a]">{site.url}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateSite.mutateAsync({ id: site.id, isActive: !site.isActive })}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              site.isActive ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {site.isActive ? 'Pause' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <BentoCard gradient>
          <div className="flex items-center gap-2 mb-2">
            <Icon icon={SignalFull02Icon} size={16} />
            <span className="text-xs font-medium text-emerald-400">UPTIME</span>
          </div>
          <div className="text-2xl font-bold text-white">{uptimeStats?.pct ?? 'N/A'}%</div>
          <div className="text-xs text-[#5a5a6a]">{uptimeStats?.up}/{uptimeStats?.total} checks</div>
        </BentoCard>
        <BentoCard gradient>
          <div className="flex items-center gap-2 mb-2">
            <Icon icon={Analytics01Icon} size={16} />
            <span className="text-xs font-medium text-purple-400">AUDIT</span>
          </div>
          <div className="text-2xl font-bold text-white">{latestAudit?.score != null ? `${latestAudit.score}` : 'N/A'}</div>
          <div className="text-xs text-[#5a5a6a]">{latestAudit?.passed || 0} passed</div>
        </BentoCard>
        <BentoCard gradient>
          <div className="flex items-center gap-2 mb-2">
            <Icon icon={DatabaseLightningIcon} size={16} />
            <span className="text-xs font-medium text-cyan-400">LIGHTHOUSE</span>
          </div>
          <div className="text-2xl font-bold text-white">{lhData?.performance != null ? `${Math.round(lhData.performance)}` : 'N/A'}</div>
          <div className="text-xs text-[#5a5a6a]">performance</div>
        </BentoCard>
        <BentoCard gradient>
          <div className="flex items-center gap-2 mb-2">
            <Icon icon={AlarmClockIcon} size={16} />
            <span className="text-xs font-medium text-amber-400">CHANGES</span>
          </div>
          <div className="text-2xl font-bold text-white">{changes?.length || 0}</div>
          <div className="text-xs text-[#5a5a6a]">{latestChange ? `Last: ${new Date(latestChange.detectedAt).toLocaleDateString()}` : 'No changes'}</div>
        </BentoCard>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <BentoCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon icon={ChartBarLineIcon} size={16} />
              <span className="text-sm font-medium text-white">Uptime History</span>
            </div>
            <button onClick={() => runUptime.mutate(id!)} className="flex items-center gap-1 px-2 py-1 rounded bg-[#1c1c28] text-xs text-[#7a7a8a] hover:text-white transition-colors">
              <Icon icon={PlayIcon} size={12} />
              Check Now
            </button>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uptimeChartData}>
                <defs>
                  <linearGradient id="uptimeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fill: '#5a5a6a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#5a5a6a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1c1c28', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff' }} />
                <Area type="monotone" dataKey="responseTime" stroke="#10b981" fill="url(#uptimeGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon icon={Analytics01Icon} size={16} />
              <span className="text-sm font-medium text-white">Audit Scores</span>
            </div>
            <button onClick={() => runAudit.mutate(id!)} className="flex items-center gap-1 px-2 py-1 rounded bg-[#1c1c28] text-xs text-[#7a7a8a] hover:text-white transition-colors">
              <Icon icon={PlayIcon} size={12} />
              Run Audit
            </button>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={auditChartData.length > 0 ? auditChartData : [{ date: 'No data', score: 0 }]}>
                <XAxis dataKey="date" tick={{ fill: '#5a5a6a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: '#5a5a6a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1c1c28', border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="score" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>
      </div>

      {lhData && (
        <BentoCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon icon={DatabaseLightningIcon} size={16} />
              <span className="text-sm font-medium text-white">Lighthouse Scores</span>
            </div>
            <button onClick={() => runLighthouse.mutate(id!)} className="flex items-center gap-1 px-2 py-1 rounded bg-[#1c1c28] text-xs text-[#7a7a8a] hover:text-white transition-colors">
              <Icon icon={PlayIcon} size={12} />
              Run Lighthouse
            </button>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Performance', value: lhData.performance, color: 'bg-emerald-500' },
              { label: 'Accessibility', value: lhData.accessibility, color: 'bg-cyan-500' },
              { label: 'Best Practices', value: lhData.bestPractices, color: 'bg-amber-500' },
              { label: 'SEO', value: lhData.seo, color: 'bg-purple-500' },
              { label: 'PWA', value: lhData.pwa, color: 'bg-rose-500' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-xs text-[#7a7a8a] mb-2">{item.label}</div>
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1c1c28" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke={item.value != null ? (item.value >= 80 ? '#10b981' : item.value >= 50 ? '#f59e0b' : '#ef4444') : '#3a3a4a'} strokeWidth="3" strokeDasharray={`${(item.value || 0) * 0.31} 100`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{item.value != null ? Math.round(item.value) : 'N/A'}</div>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      )}

      <div className="grid grid-cols-2 gap-4">
        <BentoCard>
          <div className="flex items-center gap-2 mb-4">
            <Icon icon={AlarmClockIcon} size={16} />
            <span className="text-sm font-medium text-white">Recent Changes</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {changes?.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#1c1c28] last:border-0">
                <div>
                  <div className="text-xs text-white">{c.title || 'Content changed'}</div>
                  <div className="text-xs text-[#5a5a6a]">{new Date(c.detectedAt).toLocaleString()}</div>
                </div>
                <div className="text-xs text-[#5a5a6a]">{c.diffSize.toLocaleString()} chars</div>
              </div>
            ))}
            {(!changes || changes.length === 0) && <div className="text-xs text-[#5a5a6a] text-center py-4">No changes detected</div>}
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-2 mb-4">
            <Icon icon={Settings01Icon} size={16} />
            <span className="text-sm font-medium text-white">Configuration</span>
          </div>
          <div className="space-y-3">
            {(['uptime', 'change', 'audit', 'lighthouse'] as const).map((check) => (
              <div key={check} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${site[`${check}Enabled`] ? 'bg-emerald-500' : 'bg-[#3a3a4a]'}`} />
                  <span className="text-sm text-white capitalize">{check}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#5a5a6a]">Every {site[`${check}Interval`]} min</span>
                  <button
                    onClick={() => updateSite.mutateAsync({ id: site.id, [`${check}Enabled`]: !site[`${check}Enabled`] })}
                    className={`w-8 h-4 rounded-full transition-colors ${site[`${check}Enabled`] ? 'bg-emerald-500' : 'bg-[#2a2a3a]'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${site[`${check}Enabled`] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
