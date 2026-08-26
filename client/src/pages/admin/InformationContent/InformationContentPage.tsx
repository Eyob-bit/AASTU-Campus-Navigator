import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Send, Globe, Video, Play, BookOpen, Laptop, Map, Calendar,
  Phone, Mail, Link as LinkIcon, Plus, Pencil, Trash2,
  Save, X, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight,
  Info, GripVertical, ExternalLink, Search,
} from "lucide-react";
import { infoContentApi } from "@/api/infoContent.api";
import type { InfoChannel, InfoContact, InfoLink } from "@/api/infoContent.api";
import { Card, Button, Input } from "@/components/ui";

// ── Platform options ──────────────────────────────────────────────────────────
const PLATFORM_OPTIONS = [
  { value: "telegram",  label: "Telegram",  icon: Send,   colorClass: "text-sky-400 bg-sky-500/10" },
  { value: "facebook",  label: "Facebook",  icon: Globe,  colorClass: "text-blue-400 bg-blue-500/10" },
  { value: "tiktok",    label: "TikTok",    icon: Video,  colorClass: "text-pink-400 bg-pink-500/10" },
  { value: "youtube",   label: "YouTube",   icon: Play,   colorClass: "text-red-400 bg-red-500/10" },
  { value: "website",   label: "Website",   icon: Globe,  colorClass: "text-emerald-400 bg-emerald-500/10" },
];

const ICON_OPTIONS = [
  { value: "BookOpen", label: "Library",      icon: BookOpen },
  { value: "Laptop",   label: "E-Learning",   icon: Laptop },
  { value: "Map",      label: "Campus Map",   icon: Map },
  { value: "Calendar", label: "Calendar",     icon: Calendar },
  { value: "Globe",    label: "Website",      icon: Globe },
  { value: "Link",     label: "Link",         icon: LinkIcon },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen, Laptop, Map, Calendar, Globe, Link: LinkIcon,
};
function getLinkIcon(name: string) { return ICON_MAP[name] ?? LinkIcon; }

function getPlatformIcon(platform: string) {
  return PLATFORM_OPTIONS.find(p => p.value === platform)?.icon ?? Globe;
}
function getPlatformColor(platform: string) {
  return PLATFORM_OPTIONS.find(p => p.value === platform)?.colorClass ?? "text-gray-400 bg-gray-500/10";
}

// ── Toast ─────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error";
interface Toast { id: number; msg: string; type: ToastType; }

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fixed top-6 right-6 z-50 space-y-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium pointer-events-auto transition-all
            ${t.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400" : "bg-red-50 border border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-400"}`}
        >
          {t.type === "success" ? <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0" />}
          <span>{t.msg}</span>
          <button onClick={() => onDismiss(t.id)} className="ml-2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"><X size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ── Tab type ──────────────────────────────────────────────────────────────────
type Tab = "channels" | "contacts" | "links";

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export function InformationContentPage() {
  const [activeTab, setActiveTab] = useState<Tab>("channels");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastId, setToastId] = useState(0);

  function toast(msg: string, type: ToastType = "success") {
    const id = toastId + 1;
    setToastId(id);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 sm:px-8 py-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Info size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Information Content</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Manage Telegram channels, social links, key contacts, and faculty portals shown on the public Info page.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-5 border-b border-gray-100 dark:border-slate-800">
          {(["channels", "contacts", "links"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg capitalize transition-all cursor-pointer -mb-px border-b-2
                ${activeTab === tab
                  ? "border-blue-600 dark:border-blue-400 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"}`}
            >
              {tab === "channels" ? "📡 Channels & Social" : tab === "contacts" ? "📞 Key Contacts" : "🔗 Campus Links"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto flex-1 space-y-6">
        {activeTab === "channels" && <ChannelsTab toast={toast} />}
        {activeTab === "contacts" && <ContactsTab toast={toast} />}
        {activeTab === "links"    && <LinksTab toast={toast} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHANNELS TAB
// ═══════════════════════════════════════════════════════════════════════════════

interface ChannelForm {
  label: string; url: string; platform: string; colorClass: string;
  isActive: boolean; sortOrder: number;
}

const BLANK_CHANNEL: ChannelForm = {
  label: "", url: "", platform: "telegram",
  colorClass: "text-sky-400 bg-sky-500/10", isActive: true, sortOrder: 0,
};

function ChannelsTab({ toast }: { toast: (msg: string, type?: ToastType) => void }) {
  const [channels, setChannels] = useState<InfoChannel[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<string | null>(null); // id or "new"
  const [form, setForm]         = useState<ChannelForm>(BLANK_CHANNEL);
  const [saving, setSaving]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return channels;
    const q = searchQuery.toLowerCase();
    return channels.filter(
      (ch) =>
        ch.label.toLowerCase().includes(q) ||
        ch.url.toLowerCase().includes(q) ||
        ch.platform.toLowerCase().includes(q)
    );
  }, [channels, searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setChannels(await infoContentApi.getAllChannels()); }
    catch { toast("Failed to load channels", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(ch?: InfoChannel) {
    if (ch) {
      setForm({ label: ch.label, url: ch.url, platform: ch.platform, colorClass: ch.colorClass, isActive: ch.isActive, sortOrder: ch.sortOrder });
      setEditing(ch.id);
    } else {
      setForm(BLANK_CHANNEL);
      setEditing("new");
    }
  }

  async function handleSave() {
    if (!form.label.trim() || !form.url.trim()) { toast("Label and URL are required", "error"); return; }
    setSaving(true);
    try {
      if (editing === "new") {
        await infoContentApi.createChannel(form);
        toast("Channel created!");
      } else if (editing) {
        await infoContentApi.updateChannel(editing, form);
        toast("Channel updated!");
      }
      setEditing(null);
      await load();
    } catch { toast("Failed to save channel", "error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this channel?")) return;
    try { await infoContentApi.deleteChannel(id); toast("Channel deleted!"); await load(); }
    catch { toast("Failed to delete channel", "error"); }
  }

  async function toggleActive(ch: InfoChannel) {
    try { await infoContentApi.updateChannel(ch.id, { isActive: !ch.isActive }); await load(); }
    catch { toast("Failed to update channel", "error"); }
  }

  return (
    <div className="space-y-4">
      {/* Add button + Search */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search channels..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button
          onClick={() => startEdit()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 rounded-xl font-semibold shadow-sm cursor-pointer"
        >
          <Plus size={14} /> Add Channel
        </Button>
      </div>

      {/* Add / Edit form */}
      {editing && (
        <Card className="p-5 border-2 border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
            {editing === "new" ? "New Channel" : "Edit Channel"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Label *</label>
              <Input type="text" value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} className="text-xs rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">URL *</label>
              <Input type="url" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} className="text-xs rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Platform</label>
              <select
                value={form.platform}
                onChange={e => {
                  const p = PLATFORM_OPTIONS.find(o => o.value === e.target.value);
                  setForm(f => ({ ...f, platform: e.target.value, colorClass: p?.colorClass ?? f.colorClass }));
                }}
                className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PLATFORM_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Sort Order</label>
              <Input type="number" value={String(form.sortOrder)} onChange={v => setForm(f => ({ ...f, sortOrder: parseInt(v) || 0 }))} className="text-xs rounded-xl" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              {form.isActive
                ? <ToggleRight size={20} className="text-emerald-500" />
                : <ToggleLeft size={20} className="text-gray-400 dark:text-slate-500" />}
              <span className={form.isActive ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}>
                {form.isActive ? "Active (visible on public page)" : "Inactive (hidden from public page)"}
              </span>
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2.5 rounded-xl font-semibold cursor-pointer disabled:opacity-60"
            >
              <Save size={14} /> {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing(null)}
              className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              <X size={14} /> Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-200 dark:bg-slate-800 animate-pulse" />)}
        </div>
      ) : filteredChannels.length === 0 ? (
        <Card className="p-8 text-center">
          <Send size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {searchQuery ? "No channels match your search." : "No channels yet. Add the first one!"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredChannels.map(ch => {
            const Icon = getPlatformIcon(ch.platform);
            const color = getPlatformColor(ch.platform);
            return (
              <Card key={ch.id} className={`p-4 flex items-center gap-3 transition-all ${!ch.isActive ? "opacity-50" : ""}`}>
                <GripVertical size={16} className="text-gray-300 dark:text-slate-600 flex-shrink-0" />
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ch.label}</p>
                  <a href={ch.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1 truncate">
                    {ch.url} <ExternalLink size={10} />
                  </a>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ch.isActive ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"}`}>
                    {ch.isActive ? "Active" : "Inactive"}
                  </span>
                  <button onClick={() => toggleActive(ch)} title={ch.isActive ? "Deactivate" : "Activate"} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                    {ch.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-gray-400 dark:text-slate-500" />}
                  </button>
                  <button onClick={() => startEdit(ch)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-all cursor-pointer">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(ch.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-all cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTACTS TAB
// ═══════════════════════════════════════════════════════════════════════════════

interface ContactForm { type: string; label: string; value: string; isActive: boolean; sortOrder: number; }
const BLANK_CONTACT: ContactForm = { type: "phone", label: "", value: "", isActive: true, sortOrder: 0 };

function ContactsTab({ toast }: { toast: (msg: string, type?: ToastType) => void }) {
  const [contacts, setContacts] = useState<InfoContact[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState<string | null>(null);
  const [form, setForm]         = useState<ContactForm>(BLANK_CONTACT);
  const [saving, setSaving]     = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (co) =>
        co.label.toLowerCase().includes(q) ||
        co.value.toLowerCase().includes(q) ||
        co.type.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setContacts(await infoContentApi.getAllContacts()); }
    catch { toast("Failed to load contacts", "error"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function startEdit(co?: InfoContact) {
    if (co) { setForm({ type: co.type, label: co.label, value: co.value, isActive: co.isActive, sortOrder: co.sortOrder }); setEditing(co.id); }
    else { setForm(BLANK_CONTACT); setEditing("new"); }
  }

  async function handleSave() {
    if (!form.label.trim() || !form.value.trim()) { toast("Label and value are required", "error"); return; }
    setSaving(true);
    try {
      if (editing === "new") { await infoContentApi.createContact(form); toast("Contact created!"); }
      else if (editing) { await infoContentApi.updateContact(editing, form); toast("Contact updated!"); }
      setEditing(null); await load();
    } catch { toast("Failed to save contact", "error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this contact?")) return;
    try { await infoContentApi.deleteContact(id); toast("Contact deleted!"); await load(); }
    catch { toast("Failed to delete contact", "error"); }
  }

  async function toggleActive(co: InfoContact) {
    try { await infoContentApi.updateContact(co.id, { isActive: !co.isActive }); await load(); }
    catch { toast("Failed to update contact", "error"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button onClick={() => startEdit()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 rounded-xl font-semibold shadow-sm cursor-pointer">
          <Plus size={14} /> Add Contact
        </Button>
      </div>

      {editing && (
        <Card className="p-5 border-2 border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{editing === "new" ? "New Contact" : "Edit Contact"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="phone">📞 Phone</option>
                <option value="email">✉️ Email</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Label *</label>
              <Input type="text" value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} className="text-xs rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Value * (phone/email)</label>
              <Input type="text" value={form.value} onChange={v => setForm(f => ({ ...f, value: v }))} className="text-xs rounded-xl" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
              {form.isActive ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-gray-400 dark:text-slate-500" />}
              <span className={form.isActive ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}>{form.isActive ? "Active" : "Inactive"}</span>
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2.5 rounded-xl font-semibold cursor-pointer disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)} className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl cursor-pointer">
              <X size={14} /> Cancel
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-200 dark:bg-slate-800 animate-pulse" />)}</div>
      ) : contacts.length === 0 ? (
        <Card className="p-8 text-center"><Phone size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" /><p className="text-sm text-gray-500 dark:text-slate-400">{searchQuery ? "No contacts match your search." : "No contacts yet."}</p></Card>
      ) : (
        <div className="space-y-2">
          {filteredContacts.map(co => (
            <Card key={co.id} className={`p-4 flex items-center gap-3 transition-all ${!co.isActive ? "opacity-50" : ""}`}>
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${co.type === "email" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                {co.type === "email" ? <Mail size={16} /> : <Phone size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{co.label}</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{co.value}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${co.isActive ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"}`}>{co.isActive ? "Active" : "Inactive"}</span>
                <button onClick={() => toggleActive(co)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                  {co.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-gray-400 dark:text-slate-500" />}
                </button>
                <button onClick={() => startEdit(co)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-all cursor-pointer"><Pencil size={14} /></button>
                <button onClick={() => handleDelete(co.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-all cursor-pointer"><Trash2 size={14} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LINKS TAB
// ═══════════════════════════════════════════════════════════════════════════════

interface LinkForm { label: string; url: string; iconName: string; isActive: boolean; sortOrder: number; }
const BLANK_LINK: LinkForm = { label: "", url: "", iconName: "Link", isActive: true, sortOrder: 0 };

function LinksTab({ toast }: { toast: (msg: string, type?: ToastType) => void }) {
  const [links, setLinks]     = useState<InfoLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm]       = useState<LinkForm>(BLANK_LINK);
  const [saving, setSaving]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return links;
    const q = searchQuery.toLowerCase();
    return links.filter(
      (lk) =>
        lk.label.toLowerCase().includes(q) ||
        lk.url.toLowerCase().includes(q) ||
        lk.iconName.toLowerCase().includes(q)
    );
  }, [links, searchQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setLinks(await infoContentApi.getAllLinks()); }
    catch { toast("Failed to load links", "error"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function startEdit(lk?: InfoLink) {
    if (lk) { setForm({ label: lk.label, url: lk.url, iconName: lk.iconName, isActive: lk.isActive, sortOrder: lk.sortOrder }); setEditing(lk.id); }
    else { setForm(BLANK_LINK); setEditing("new"); }
  }

  async function handleSave() {
    if (!form.label.trim() || !form.url.trim()) { toast("Label and URL are required", "error"); return; }
    setSaving(true);
    try {
      if (editing === "new") { await infoContentApi.createLink(form); toast("Link created!"); }
      else if (editing) { await infoContentApi.updateLink(editing, form); toast("Link updated!"); }
      setEditing(null); await load();
    } catch { toast("Failed to save link", "error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this link?")) return;
    try { await infoContentApi.deleteLink(id); toast("Link deleted!"); await load(); }
    catch { toast("Failed to delete link", "error"); }
  }

  async function toggleActive(lk: InfoLink) {
    try { await infoContentApi.updateLink(lk.id, { isActive: !lk.isActive }); await load(); }
    catch { toast("Failed to update link", "error"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search links..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button onClick={() => startEdit()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 rounded-xl font-semibold shadow-sm cursor-pointer">
          <Plus size={14} /> Add Link
        </Button>
      </div>

      {editing && (
        <Card className="p-5 border-2 border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/20">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{editing === "new" ? "New Campus Link" : "Edit Campus Link"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Label *</label>
              <Input type="text" value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} className="text-xs rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">URL or Route * (e.g. https://… or /search)</label>
              <Input type="text" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} className="text-xs rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Icon</label>
              <select value={form.iconName} onChange={e => setForm(f => ({ ...f, iconName: e.target.value }))}
                className="w-full text-xs border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Sort Order</label>
              <Input type="number" value={String(form.sortOrder)} onChange={v => setForm(f => ({ ...f, sortOrder: parseInt(v) || 0 }))} className="text-xs rounded-xl" />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
              {form.isActive ? <ToggleRight size={20} className="text-emerald-500" /> : <ToggleLeft size={20} className="text-gray-400 dark:text-slate-500" />}
              <span className={form.isActive ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}>{form.isActive ? "Active" : "Inactive"}</span>
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2.5 rounded-xl font-semibold cursor-pointer disabled:opacity-60">
              <Save size={14} /> {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)} className="flex items-center gap-2 text-xs px-4 py-2.5 rounded-xl cursor-pointer">
              <X size={14} /> Cancel
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-200 dark:bg-slate-800 animate-pulse" />)}</div>
      ) : links.length === 0 ? (
        <Card className="p-8 text-center"><LinkIcon size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-3" /><p className="text-sm text-gray-500 dark:text-slate-400">{searchQuery ? "No links match your search." : "No campus links yet."}</p></Card>
      ) : (
        <div className="space-y-2">
          {filteredLinks.map(lk => {
            const Icon = getLinkIcon(lk.iconName);
            return (
              <Card key={lk.id} className={`p-4 flex items-center gap-3 transition-all ${!lk.isActive ? "opacity-50" : ""}`}>
                <GripVertical size={16} className="text-gray-300 dark:text-slate-600 flex-shrink-0" />
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{lk.label}</p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{lk.url}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${lk.isActive ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"}`}>{lk.isActive ? "Active" : "Inactive"}</span>
                  <button onClick={() => toggleActive(lk)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
                    {lk.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} className="text-gray-400 dark:text-slate-500" />}
                  </button>
                  <button onClick={() => startEdit(lk)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 transition-all cursor-pointer"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(lk.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/40 text-red-500 dark:text-red-400 transition-all cursor-pointer"><Trash2 size={14} /></button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
