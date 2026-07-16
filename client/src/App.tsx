import { Navigate, Route, Routes } from "react-router-dom";

// Public layout + pages
import { MainLayout } from "@/layouts/MainLayout";
import { HomePage } from "@/pages/Home";
import { SearchPage } from "@/pages/Search";
import { NavigationPage } from "@/pages/Navigation";
import { PanoramaPage } from "@/pages/Panorama";
import { NotFoundPage } from "@/pages/NotFound";

// Admin layout + auth
import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthGuard } from "@/router/AuthGuard";

// Admin pages
import { LoginPage } from "@/pages/admin/Login/LoginPage";
import { DashboardPage } from "@/pages/admin/Dashboard/DashboardPage";
import { BuildingsPage } from "@/pages/admin/Buildings/BuildingsPage";
import { FloorsPage } from "@/pages/admin/Floors/FloorsPage";
import { OfficesPage } from "@/pages/admin/Offices/OfficesPage";
import { StaffPage } from "@/pages/admin/Staff/StaffPage";
import { AliasesPage } from "@/pages/admin/Aliases/AliasesPage";
import { AnnouncementsPage } from "@/pages/admin/Announcements/AnnouncementsPage";
import { PanoramaGalleryPage } from "@/pages/admin/PanoramaGallery/PanoramaGalleryPage";
import { SceneEditorPage } from "@/pages/admin/SceneEditor/SceneEditorPage";
import { NavigationPreviewPage } from "@/pages/admin/NavigationPreview/NavigationPreviewPage";
import { SettingsPage } from "@/pages/admin/Settings/SettingsPage";

export default function App() {
  return (
    <Routes>
      {/* ── Public campus app ── */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="navigation" element={<NavigationPage />} />
        <Route path="panorama" element={<PanoramaPage />} />
        <Route path="404" element={<NotFoundPage />} />
      </Route>

      {/* ── Admin: login (no auth required) ── */}
      <Route path="/login" element={<LoginPage />} />

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
        <Route path="buildings" element={<BuildingsPage />} />
        <Route path="floors" element={<FloorsPage />} />
        <Route path="offices" element={<OfficesPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="aliases" element={<AliasesPage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="panoramas" element={<PanoramaGalleryPage />} />
        <Route path="scene-editor" element={<SceneEditorPage />} />
        <Route path="nav-preview" element={<NavigationPreviewPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
