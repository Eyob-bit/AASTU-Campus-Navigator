import { useState, useEffect, useRef } from "react";
import {
  User,
  Key,
  Camera,
  Trash2,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Mail,
  BadgeCheck,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Card, Button, Input } from "@/components/ui";
import { useAdminProfile } from "@/hooks/useAdminProfile";

export function ProfilePage() {
  const { profile, updateProfile, changePassword } = useAdminProfile();

  // Profile Form state
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl || null,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile";
      alert(msg);
    } finally {
      setProfileSaving(false);
    }
  }

  function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 4) {
      setPasswordError("New password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password";
      setPasswordError(msg);
    } finally {
      setPasswordSaving(false);
    }
  }

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AD";

  const formattedDate = profile.updatedAt
    ? new Date(profile.updatedAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 sm:px-8 py-6 sm:py-8 flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <User className="text-blue-600 dark:text-blue-400" size={24} />
            My Admin Profile
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Manage your administrator profile details, avatar picture, and account security credentials.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-semibold">
          <BadgeCheck size={16} />
          <span>{profile.role}</span>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6 sm:space-y-8 flex-1">
        {/* Profile Card */}
        <Card className="p-4 sm:p-6 border-l-4 border-l-blue-600 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4 mb-6 gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600 dark:text-blue-400" />
              Personal Information & Avatar
            </h3>
            <span className="text-[11px] text-gray-400 dark:text-slate-400 flex items-center gap-1">
              <Calendar size={12} /> Last updated: {formattedDate}
            </span>
          </div>

          {profileSaved && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 rounded-xl mb-6 font-semibold flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              Profile updated successfully! Your picture and details are updated across all dashboard pages.
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-blue-50/40 dark:bg-slate-800/40 p-4 rounded-2xl border border-blue-100/60 dark:border-slate-700/60">
              <div className="relative group flex-shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Admin Avatar"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-2xl rounded-2xl flex items-center justify-center border-2 border-blue-200 dark:border-blue-800 shadow-md">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 p-2 rounded-xl border border-gray-200 dark:border-slate-700 shadow-md hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition-all cursor-pointer"
                  title="Upload profile picture"
                >
                  <Camera size={15} />
                </button>
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Profile Picture</h4>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Upload a high-resolution square image for your admin account. Supported formats: JPG, PNG, WEBP (max 5MB).
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer"
                  >
                    <Camera size={14} /> Upload New Picture
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAvatarUrl(null)}
                      className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={14} /> Remove Picture
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <User size={13} className="text-gray-400 dark:text-slate-500" /> Admin Full Name
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(val) => setFullName(val)}
                  placeholder="Enter full name"
                  className="text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Mail size={13} className="text-gray-400 dark:text-slate-500" /> Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(val) => setEmail(val)}
                  placeholder="admin@aastu.edu.et"
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2.5 rounded-xl font-semibold cursor-pointer disabled:opacity-60 shadow-sm"
                disabled={profileSaving}
              >
                {profileSaving ? "Saving Changes..." : "Save Profile Details"}
              </Button>
            </div>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card className="p-6 border-l-4 border-l-indigo-600 shadow-sm">
          <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Key size={16} className="text-indigo-600 dark:text-indigo-400" />
              Security & Password Credentials
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Ensure your admin account stays secure by choosing a strong password.
            </p>
          </div>

          {passwordError && (
            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs p-3.5 rounded-xl mb-5 font-semibold">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs p-3.5 rounded-xl mb-5 font-semibold flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              Password updated successfully! Your new password is now active in the system database.
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Current Password</label>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(val) => setCurrentPassword(val)}
                  icon={<Lock size={14} />}
                  className="text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">New Password</label>
                <Input
                  type="password"
                  placeholder="Min 4 characters"
                  value={newPassword}
                  onChange={(val) => setNewPassword(val)}
                  icon={<Key size={14} />}
                  className="text-xs rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(val) => setConfirmPassword(val)}
                  icon={<Key size={14} />}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2.5 rounded-xl font-semibold cursor-pointer disabled:opacity-60 shadow-sm"
                disabled={passwordSaving}
              >
                {passwordSaving ? "Updating Password..." : "Update Password"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
