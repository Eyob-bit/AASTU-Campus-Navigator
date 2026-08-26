import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

// Public layout + pages
import { MainLayout } from "@/layouts/MainLayout";
import { HomePage } from "@/pages/Home";
import { ChatbotPage } from "@/pages/Chatbot/ChatbotPage";
import { InformationPage } from "@/pages/Information/InformationPage";
import { AboutPage } from "@/pages/About/AboutPage";
import { SearchPage } from "@/pages/Search";
import { NavigationPage } from "@/pages/Navigation";
import { PanoramaPage } from "@/pages/Panorama";
import { PublicPanoramaPage } from "@/pages/Panorama";
import { NotFoundPage } from "@/pages/NotFound";

// Admin layout + auth
import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthGuard } from "@/router/AuthGuard";

// Admin pages - eagerly loaded (small, frequently accessed)
import { LoginPage } from "@/pages/admin/Login/LoginPage";
import { DashboardPage } from "@/pages/admin/Dashboard/DashboardPage";

// Admin pages - lazy loaded (heavy, less frequent)
const BuildingsPage = lazy(() => import("@/pages/admin/Buildings/BuildingsPage").then(m => ({ default: m.BuildingsPage })));
const FloorsPage = lazy(() => import("@/pages/admin/Floors/FloorsPage").then(m => ({ default: m.FloorsPage })));
const OfficesPage = lazy(() => import("@/pages/admin/Offices/OfficesPage").then(m => ({ default: m.OfficesPage })));
const StaffPage = lazy(() => import("@/pages/admin/Staff/StaffPage").then(m => ({ default: m.StaffPage })));
const AliasesPage = lazy(() => import("@/pages/admin/Aliases/AliasesPage").then(m => ({ default: m.AliasesPage })));
const AnalyticsPage = lazy(() => import("@/pages/admin/Analytics/AnalyticsPage").then(m => ({ default: m.AnalyticsPage })));
const PanoramaGalleryPage = lazy(() => import("@/pages/admin/PanoramaGallery/PanoramaGalleryPage").then(m => ({ default: m.PanoramaGalleryPage })));
const SceneEditorPage = lazy(() => import("@/pages/admin/SceneEditor/SceneEditorPage").then(m => ({ default: m.SceneEditorPage })));
const NavigationPreviewPage = lazy(() => import("@/pages/admin/NavigationPreview/NavigationPreviewPage").then(m => ({ default: m.NavigationPreviewPage })));
const SettingsPage = lazy(() => import("@/pages/admin/Settings/SettingsPage").then(m => ({ default: m.SettingsPage })));
const ProfilePage = lazy(() => import("@/pages/admin/Profile/ProfilePage").then(m => ({ default: m.ProfilePage })));
const LandmarksPage = lazy(() => import("@/pages/admin/Landmarks/LandmarksPage").then(m => ({ default: m.LandmarksPage })));
const RoadNetworkPage = lazy(() => import("@/pages/admin/RoadNetwork/RoadNetworkPage").then(m => ({ default: m.RoadNetworkPage })));
const InformationContentPage = lazy(() => import("@/pages/admin/InformationContent/InformationContentPage").then(m => ({ default: m.InformationContentPage })));

function AdminSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ── Public campus app ── */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="chatbot" element={<ChatbotPage />} />
        <Route path="info" element={<InformationPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="navigation" element={<NavigationPage />} />
        <Route path="panorama" element={<PanoramaPage />} />
        <Route path="404" element={<NotFoundPage />} />
      </Route>

      {/* ── Public: full-screen panorama viewer (no layout chrome) ── */}
      <Route path="/panorama/:sceneId" element={<PublicPanoramaPage />} />

      {/* ── Admin: login (no auth required) ── */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
      <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />

      {/* ── Admin: protected dashboard ── */}
      <Route
        path="/dashboard"
        element={
          <AuthGuard>
            <AdminLayout />
          </AuthGuard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="analytics" element={<AdminSuspense><AnalyticsPage /></AdminSuspense>} />
        <Route path="buildings" element={<AdminSuspense><BuildingsPage /></AdminSuspense>} />
        <Route path="floors" element={<AdminSuspense><FloorsPage /></AdminSuspense>} />
        <Route path="offices" element={<AdminSuspense><OfficesPage /></AdminSuspense>} />
        <Route path="staff" element={<AdminSuspense><StaffPage /></AdminSuspense>} />
        <Route path="aliases" element={<AdminSuspense><AliasesPage /></AdminSuspense>} />
        <Route path="panoramas" element={<AdminSuspense><PanoramaGalleryPage /></AdminSuspense>} />
        <Route path="scene-editor" element={<AdminSuspense><SceneEditorPage /></AdminSuspense>} />
        <Route path="scene-editor/:sceneId" element={<AdminSuspense><SceneEditorPage /></AdminSuspense>} />
        <Route path="nav-preview" element={<AdminSuspense><NavigationPreviewPage /></AdminSuspense>} />
        <Route path="nav-preview/:sceneId" element={<AdminSuspense><NavigationPreviewPage /></AdminSuspense>} />
        <Route path="road-network" element={<AdminSuspense><RoadNetworkPage /></AdminSuspense>} />
        <Route path="profile" element={<AdminSuspense><ProfilePage /></AdminSuspense>} />
        <Route path="settings" element={<AdminSuspense><SettingsPage /></AdminSuspense>} />
        <Route path="landmarks" element={<AdminSuspense><LandmarksPage /></AdminSuspense>} />
        <Route path="info-content" element={<AdminSuspense><InformationContentPage /></AdminSuspense>} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

