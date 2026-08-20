import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Navigation, Mail, Lock, Eye, EyeOff, AlertCircle, Building2, Image, Users } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const { isAuthenticated, login, isLoading, error } = useAdminAuth();
  const navigate = useNavigate();

  // If already logged in, redirect straight to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) return;
    const ok = await login(email.trim(), password);
    if (ok) {
      navigate("/dashboard", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-blue-600">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />
        <img
          src="https://images.unsplash.com/photo-1562774053-701939374585?w=900&h=1200&fit=crop&auto=format"
          alt="AASTU Campus"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Navigation size={18} className="text-white" />
            </div>
            <span className="text-white font-semibold text-lg">AASTU Navigator</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Campus Navigation<br />Made Simple
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed max-w-sm">
              Manage buildings, offices, panorama scenes, and help every visitor find their way across campus.
            </p>
            <div className="mt-10 flex flex-col gap-4">
              {FEATURE_LIST.map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <item.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{item.label}</p>
                    <p className="text-blue-300 text-xs">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-blue-300 text-xs">© 2025 AASTU Campus Navigator. All rights reserved.</p>
        </div>
      </div>

      {/* Right / form */}
      <div className="flex-1 lg:max-w-[480px] flex items-center justify-center p-8">
        <div className="w-full max-w-[380px]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center">
              <Navigation size={20} className="text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">AASTU Navigator</p>
              <p className="text-xs text-gray-500">Admin Dashboard</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your administrator account</p>

          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl mb-5">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {(!email.trim() || !password.trim()) && (
            <p className="text-xs text-gray-400 -mt-1 mb-1">Fill in both fields to sign in.</p>
          )}

          <div className="flex flex-col gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aastu.edu.et"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors ml-auto">
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign in to Dashboard"
              )}
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Need access? Contact your{" "}
            <span className="text-blue-600 font-medium cursor-pointer hover:underline">
              system administrator
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const FEATURE_LIST = [
  { icon: Building2, label: "5 Buildings managed",     sub: "Across the AASTU campus" },
  { icon: Image,     label: "200+ Panorama scenes",    sub: "Immersive 360° navigation" },
  { icon: Users,     label: "140+ Staff profiles",     sub: "With office locations" },
];
