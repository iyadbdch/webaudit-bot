import { useDashboard } from '../api/hooks';
import { BentoCard } from '../components/BentoCard';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  GlobeIcon, SignalFull02Icon, SignalLow01Icon, CheckmarkCircle02Icon,
  AlarmClockIcon, ChartBarLineIcon, Analytics01Icon, DatabaseLightningIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useNavigate } from 'react-router-dom';

function Icon({ icon, size }: { icon: IconSvgElement; size?: number }) {
  return <HugeiconsIcon icon={icon} size={size ?? 22} />;
}

function StatCard({ icon: Icn, label, value, color }: { icon: IconSvgElement; label: string; value: string | number; color: string }) {
  return (
    <BentoCard className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
        <Icon icon={Icn} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-[#7a7a8a]">{label}</div>
      </div>
    </BentoCard>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const navigate = useNavigate();

  if (isLoading) return <div className="text-[#7a7a8a]">Loading dashboard...</div>;

  const overallUptime = data?.sites?.length
    ? Math.round(data.sites.reduce((a, s) => a + s.uptimePercent, 0) / data.sites.length)
    : 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-[#7a7a8a] mt-1">Website monitoring overview</p>
        </div>
        <button
          onClick={() => navigate('/sites')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg text-sm transition-colors"
        >
          + Add Site
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={GlobeIcon} label="Total Sites" value={data?.totalSites || 0} color="bg-emerald-500/20" />
        <StatCard icon={CheckmarkCircle02Icon} label="Healthy" value={data?.healthySites || 0} color="bg-emerald-500/20" />
        <StatCard icon={SignalLow01Icon} label="Down" value={data?.downSites || 0} color="bg-rose-500/20" />
        <StatCard icon={AlarmClockIcon} label="Changes Today" value={data?.changesToday || 0} color="bg-amber-500/20" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <BentoCard className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon={ChartBarLineIcon} size={18} />
            <span className="text-sm font-medium text-white">Overall Uptime</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white">{overallUptime}%</span>
            <span className="text-sm text-[#7a7a8a] mb-1">last 30 days</span>
          </div>
          <div className="mt-4 h-2 bg-[#1c1c28] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
              style={{ width: `${overallUptime}%` }}
            />
          </div>
        </BentoCard>
        <BentoCard>
          <div className="flex items-center gap-2 mb-4">
            <Icon icon={Analytics01Icon} size={18} />
            <span className="text-sm font-medium text-white">Avg Audit Score</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white">
              {data?.sites?.length
                ? Math.round(data.sites.filter((s) => s.auditScore).reduce((a, s) => a + (s.auditScore || 0), 0) / data.sites.filter((s) => s.auditScore).length)
                : 'N/A'}
            </span>
          </div>
        </BentoCard>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <BentoCard gradient>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon={SignalFull02Icon} size={16} />
            <span className="text-xs font-medium text-emerald-400">UPTIME</span>
          </div>
          <div className="text-lg font-bold text-white">
            {data?.sites?.filter((s) => s.enabled.uptime).length || 0}/{data?.totalSites || 0}
          </div>
          <div className="text-xs text-[#7a7a8a]">monitored</div>
        </BentoCard>
        <BentoCard gradient>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon={AlarmClockIcon} size={16} />
            <span className="text-xs font-medium text-amber-400">CHANGES</span>
          </div>
          <div className="text-lg font-bold text-white">
            {data?.sites?.filter((s) => s.enabled.change).length || 0}/{data?.totalSites || 0}
          </div>
          <div className="text-xs text-[#7a7a8a]">tracked</div>
        </BentoCard>
        <BentoCard gradient>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon={Analytics01Icon} size={16} />
            <span className="text-xs font-medium text-purple-400">AUDITS</span>
          </div>
          <div className="text-lg font-bold text-white">
            {data?.sites?.filter((s) => s.enabled.audit).length || 0}/{data?.totalSites || 0}
          </div>
          <div className="text-xs text-[#7a7a8a]">enabled</div>
        </BentoCard>
        <BentoCard gradient>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon={DatabaseLightningIcon} size={16} />
            <span className="text-xs font-medium text-cyan-400">LIGHTHOUSE</span>
          </div>
          <div className="text-lg font-bold text-white">
            {data?.sites?.filter((s) => s.enabled.lighthouse).length || 0}/{data?.totalSites || 0}
          </div>
          <div className="text-xs text-[#7a7a8a]">active</div>
        </BentoCard>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Sites Overview</h2>
      <div className="space-y-3">
        {data?.sites?.map((site) => (
          <BentoCard key={site.id} className="flex items-center justify-between" onClick={() => navigate(`/sites/${site.id}`)}>
            <div className="flex items-center gap-4">
              <div className={`w-2.5 h-2.5 rounded-full ${
                site.status === 'up' ? 'bg-emerald-500' : site.status === 'down' ? 'bg-rose-500' : site.status === 'slow' ? 'bg-amber-500' : 'bg-[#3a3a4a]'
              }`} />
              <div>
                <div className="text-sm font-medium text-white">{site.name}</div>
                <div className="text-xs text-[#5a5a6a]">{site.url}</div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-sm font-medium text-white">{site.uptimePercent}%</div>
                <div className="text-xs text-[#5a5a6a]">uptime</div>
              </div>
              {site.lighthousePerf != null && (
                <div className="text-right">
                  <div className="text-sm font-medium text-white">{site.lighthousePerf}</div>
                  <div className="text-xs text-[#5a5a6a]">perf</div>
                </div>
              )}
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                site.status === 'up' ? 'bg-emerald-500/10 text-emerald-400' :
                site.status === 'down' ? 'bg-rose-500/10 text-rose-400' :
                'bg-[#1c1c28] text-[#5a5a6a]'
              }`}>
                {site.status === 'up' ? 'Online' : site.status === 'down' ? 'Offline' : site.status}
              </div>
            </div>
          </BentoCard>
        ))}
        {(!data?.sites || data.sites.length === 0) && (
          <BentoCard className="text-center py-12">
            <HugeiconsIcon icon={GlobeIcon} size={40} className="mx-auto text-[#3a3a4a] mb-3" />
            <div className="text-[#7a7a8a] text-sm">No sites added yet</div>
            <button onClick={() => navigate('/sites')} className="mt-3 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg text-sm transition-colors">
              Add your first site
            </button>
          </BentoCard>
        )}
      </div>
    </div>
  );
}
