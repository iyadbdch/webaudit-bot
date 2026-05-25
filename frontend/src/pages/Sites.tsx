import { useState } from 'react';
import { useSites, useCreateSite, useUpdateSite, useDeleteSite } from '../api/hooks';
import { BentoCard } from '../components/BentoCard';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AddCircleIcon, Edit02Icon, Delete01Icon, Settings01Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { useNavigate } from 'react-router-dom';

function Icon({ icon, size = 18 }: { icon: IconSvgElement; size?: number }) {
  return <HugeiconsIcon icon={icon} size={size} />;
}

const defaultForm = {
  name: '', url: '', uptimeEnabled: true, changeEnabled: false,
  auditEnabled: false, lighthouseEnabled: false,
  uptimeInterval: 5, changeInterval: 60, auditInterval: 1440, lighthouseInterval: 1440,
};

export default function Sites() {
  const { data: sites } = useSites();
  const createSite = useCreateSite();
  const updateSite = useUpdateSite();
  const deleteSite = useDeleteSite();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(defaultForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await updateSite.mutateAsync({ id: editing.id, ...form });
    } else {
      await createSite.mutateAsync(form);
    }
    setShowForm(false);
    setEditing(null);
    setForm(defaultForm);
  };

  const handleEdit = (site: any) => {
    setForm({
      name: site.name, url: site.url, uptimeEnabled: site.uptimeEnabled,
      changeEnabled: site.changeEnabled, auditEnabled: site.auditEnabled,
      lighthouseEnabled: site.lighthouseEnabled, uptimeInterval: site.uptimeInterval,
      changeInterval: site.changeInterval, auditInterval: site.auditInterval,
      lighthouseInterval: site.lighthouseInterval,
    });
    setEditing(site);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this site?')) {
      await deleteSite.mutateAsync(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Sites</h1>
          <p className="text-sm text-[#7a7a8a] mt-1">Manage your monitored websites</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(defaultForm); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg text-sm transition-colors"
        >
          <Icon icon={AddCircleIcon} />
          {showForm ? 'Cancel' : 'Add Site'}
        </button>
      </div>

      {showForm && (
        <BentoCard className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">{editing ? 'Edit Site' : 'Add New Site'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7a7a8a] mb-1">Site Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c28] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="My Website" required />
              </div>
              <div>
                <label className="block text-xs text-[#7a7a8a] mb-1">URL</label>
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#1c1c28] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="https://example.com" required />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#7a7a8a] mb-2">Enabled Checks</label>
              <div className="flex flex-wrap gap-3">
                {(['uptime', 'change', 'audit', 'lighthouse'] as const).map((check) => (
                  <label key={check} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form[`${check}Enabled` as keyof typeof form] as boolean}
                      onChange={(e) => setForm({ ...form, [`${check}Enabled`]: e.target.checked })}
                      className="w-4 h-4 rounded border-[#2a2a3a] bg-[#1c1c28] text-emerald-500 focus:ring-emerald-500" />
                    <span className="text-sm text-white capitalize">{check}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {(['uptime', 'change', 'audit', 'lighthouse'] as const).map((check) => (
                <div key={check}>
                  <label className="block text-xs text-[#7a7a8a] mb-1 capitalize">{check} Interval (min)</label>
                  <input type="number" min={1} value={form[`${check}Interval` as keyof typeof form] as number}
                    onChange={(e) => setForm({ ...form, [`${check}Interval`]: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg bg-[#1c1c28] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-emerald-500" />
                </div>
              ))}
            </div>
            <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg text-sm transition-colors">
              {editing ? 'Update Site' : 'Add Site'}
            </button>
          </form>
        </BentoCard>
      )}

      <div className="space-y-3">
        {sites?.map((site) => (
          <BentoCard key={site.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => navigate(`/sites/${site.id}`)}>
              <div className={`w-2.5 h-2.5 rounded-full ${site.isActive ? 'bg-emerald-500' : 'bg-[#3a3a4a]'}`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{site.name}</div>
                <div className="text-xs text-[#5a5a6a]">{site.url}</div>
              </div>
              <div className="flex gap-3 text-xs text-[#5a5a6a]">
                {site.uptimeEnabled && <span className="text-emerald-400">Uptime</span>}
                {site.changeEnabled && <span className="text-amber-400">Changes</span>}
                {site.auditEnabled && <span className="text-purple-400">Audit</span>}
                {site.lighthouseEnabled && <span className="text-cyan-400">Lighthouse</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => handleEdit(site)} className="p-2 rounded-lg hover:bg-[#1c1c28] text-[#5a5a6a] hover:text-white transition-colors">
                <Icon icon={Edit02Icon} />
              </button>
              <button onClick={() => handleDelete(site.id)} className="p-2 rounded-lg hover:bg-rose-500/10 text-[#5a5a6a] hover:text-rose-400 transition-colors">
                <Icon icon={Delete01Icon} />
              </button>
            </div>
          </BentoCard>
        ))}
        {(!sites || sites.length === 0) && (
          <BentoCard className="text-center py-12">
            <HugeiconsIcon icon={Settings01Icon} size={40} className="mx-auto text-[#3a3a4a] mb-3" />
            <div className="text-[#7a7a8a] text-sm">No sites added yet</div>
          </BentoCard>
        )}
      </div>
    </div>
  );
}
