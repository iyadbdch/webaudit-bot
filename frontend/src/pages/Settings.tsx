import { useState } from 'react';
import { BentoCard } from '../components/BentoCard';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification03Icon, Key01Icon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';

function Icon({ icon, size = 18 }: { icon: IconSvgElement; size?: number }) {
  return <HugeiconsIcon icon={icon} size={size} />;
}

export default function Settings() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('api_key') || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('api_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#7a7a8a] mt-1">Configure your WebAudit Bot</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <BentoCard>
          <div className="flex items-center gap-2 mb-4">
            <Icon icon={Key01Icon} size={16} />
            <span className="text-sm font-medium text-white">API Configuration</span>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[#7a7a8a] mb-1">API Key</label>
              <input value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#1c1c28] border border-[#2a2a3a] text-white text-sm focus:outline-none focus:border-emerald-500"
                placeholder="Enter your API key" />
            </div>
            <button onClick={handleSave}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg text-sm transition-colors">
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </BentoCard>

        <BentoCard>
          <div className="flex items-center gap-2 mb-4">
            <Icon icon={Notification03Icon} size={16} />
            <span className="text-sm font-medium text-white">WhatsApp Integration</span>
          </div>
          <div className="space-y-3 text-sm text-[#7a7a8a]">
            <p>Configure in <code className="text-emerald-400">backend/.env</code>:</p>
            <div className="bg-[#1c1c28] rounded-lg p-3 text-xs font-mono">
              <div>OPENWA_API_URL=http://localhost:2785/api</div>
              <div>OPENWA_API_KEY=your-api-key</div>
              <div>WHATSAPP_ENABLED=true</div>
              <div>WHATSAPP_NOTIFY_CHAT_ID=628xxx@c.us</div>
            </div>
            <p className="text-xs mt-2">Set WHATSAPP_ENABLED=true and restart the backend to receive WhatsApp notifications via OpenWA.</p>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
