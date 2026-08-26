import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Compass,
  Search,
  Palette,
  Shield,
  Save,
  CheckCircle2,
  RefreshCw,
  Building,
} from "lucide-react";
import { Card, Button, Input } from "@/components/ui";

interface SystemSettings {
  // General
  universityName: string;
  campusCode: string;
  defaultTimezone: string;
  // Navigation
  walkingSpeedMs: number;
  arrivalRadiusM: number;
  rerouteThresholdM: number;
  // Search
  maxSearchResults: number;
  fuzzySearchEnabled: boolean;
  includeStaffInSearch: boolean;
  // Branding
  themeColor: string;
  campusSubtitle: string;
  // Contact
  supportEmail: string;
  emergencyPhone: string;
  // Security
  sessionTimeoutMin: number;
}

const DEFAULT_SETTINGS: SystemSettings = {
  universityName: "Addis Ababa Science and Technology University",
  campusCode: "AASTU-HQ",
  defaultTimezone: "Africa/Addis_Ababa",
  walkingSpeedMs: 1.4,
  arrivalRadiusM: 15,
  rerouteThresholdM: 20,
  maxSearchResults: 10,
  fuzzySearchEnabled: true,
  includeStaffInSearch: true,
  themeColor: "#2563eb",
  campusSubtitle: "3D Campus Navigation & Directory",
  supportEmail: "info@aastu.edu.et",
  emergencyPhone: "+251 11 888 0000",
  sessionTimeoutMin: 60,
};

const STORAGE_KEY = "aastu_system_config";

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      } catch {}
    }
  }, []);

  function handleSaveSettings(e?: React.FormEvent) {
    if (e) e.preventDefault();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }

  function handleResetSettings() {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 sm:px-8 py-6 sm:py-8 flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <SettingsIcon className="text-blue-600 dark:text-blue-400" size={24} />
            System Configuration
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Configure navigation engine tolerances, search alias rules, branding, and campus system thresholds.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            onClick={() => handleResetSettings()}
            variant="outline"
            className="w-full sm:w-auto text-xs px-4 py-2.5 rounded-xl border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw size={14} className="mr-1.5 inline" />
            Reset Defaults
          </Button>
          <Button
            onClick={() => handleSaveSettings()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2.5 rounded-xl font-semibold shadow-sm cursor-pointer"
          >
            <Save size={16} />
            Save All Settings
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6 sm:space-y-8 flex-1">
        {isSaved && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm px-4 py-3 rounded-xl flex items-center gap-2 font-semibold">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            System configuration saved successfully! Active across all app modules.
          </div>
        )}

        {/* ── System Configuration Form ── */}
        <form onSubmit={(e) => handleSaveSettings(e)} className="space-y-6">
          {/* General Info */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <Building size={16} className="text-blue-600 dark:text-blue-400" />
              General System Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">University Name</label>
                <Input
                  type="text"
                  value={settings.universityName}
                  onChange={(val) => setSettings({ ...settings, universityName: val })}
                  className="text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Campus Code</label>
                <Input
                  type="text"
                  value={settings.campusCode}
                  onChange={(val) => setSettings({ ...settings, campusCode: val })}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>
          </Card>

          {/* Navigation Engine Tuning */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <Compass size={16} className="text-indigo-600 dark:text-indigo-400" />
              Navigation Engine Tolerances
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Walking Speed (m/s)</label>
                <Input
                  type="number"
                  value={String(settings.walkingSpeedMs)}
                  onChange={(val) => setSettings({ ...settings, walkingSpeedMs: parseFloat(val) || 1.4 })}
                  className="text-xs rounded-xl"
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Used for estimated walking time calculations</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Arrival Radius (meters)</label>
                <Input
                  type="number"
                  value={String(settings.arrivalRadiusM)}
                  onChange={(val) => setSettings({ ...settings, arrivalRadiusM: parseInt(val, 10) || 15 })}
                  className="text-xs rounded-xl"
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Distance trigger to prompt arrival state</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Off-Route Reroute Radius (m)</label>
                <Input
                  type="number"
                  value={String(settings.rerouteThresholdM)}
                  onChange={(val) => setSettings({ ...settings, rerouteThresholdM: parseInt(val, 10) || 20 })}
                  className="text-xs rounded-xl"
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Perpendicular distance threshold before auto-reroute</p>
              </div>
            </div>
          </Card>

          {/* Search & Discovery */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <Search size={16} className="text-emerald-600 dark:text-emerald-400" />
              Search & Discovery Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Max Search Results</label>
                <Input
                  type="number"
                  value={String(settings.maxSearchResults)}
                  onChange={(val) => setSettings({ ...settings, maxSearchResults: parseInt(val, 10) || 10 })}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="fuzzy"
                  checked={settings.fuzzySearchEnabled}
                  onChange={(e) => setSettings({ ...settings, fuzzySearchEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="fuzzy" className="text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer">
                  Enable Search Alias Matching
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="staff"
                  checked={settings.includeStaffInSearch}
                  onChange={(e) => setSettings({ ...settings, includeStaffInSearch: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="staff" className="text-xs font-semibold text-gray-700 dark:text-slate-300 cursor-pointer">
                  Include Directory Staff Profiles
                </label>
              </div>
            </div>
          </Card>

          {/* Branding */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <Palette size={16} className="text-purple-600 dark:text-purple-400" />
              Branding & Presentation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Primary Theme Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={settings.themeColor}
                    onChange={(e) => setSettings({ ...settings, themeColor: e.target.value })}
                    className="w-10 h-9 p-0.5 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={settings.themeColor}
                    onChange={(val) => setSettings({ ...settings, themeColor: val })}
                    className="text-xs rounded-xl flex-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Campus Subtitle</label>
                <Input
                  type="text"
                  value={settings.campusSubtitle}
                  onChange={(val) => setSettings({ ...settings, campusSubtitle: val })}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>
          </Card>

          {/* Security & Contact */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-slate-800 pb-3">
              <Shield size={16} className="text-rose-600 dark:text-rose-400" />
              Security & Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Support Email</label>
                <Input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(val) => setSettings({ ...settings, supportEmail: val })}
                  className="text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Emergency Phone</label>
                <Input
                  type="text"
                  value={settings.emergencyPhone}
                  onChange={(val) => setSettings({ ...settings, emergencyPhone: val })}
                  className="text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Session Timeout (minutes)</label>
                <Input
                  type="number"
                  value={String(settings.sessionTimeoutMin)}
                  onChange={(val) => setSettings({ ...settings, sessionTimeoutMin: parseInt(val, 10) || 60 })}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-end pt-2 pb-8">
            <Button
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-6 py-3 rounded-xl font-semibold shadow cursor-pointer"
            >
              <Save size={16} />
              Save System Configuration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
