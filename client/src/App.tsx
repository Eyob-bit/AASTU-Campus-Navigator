import { Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "@/layouts";
import { HomePage } from "@/pages/Home";
import { SearchPage } from "@/pages/Search";
import { NavigationPage } from "@/pages/Navigation";
import { PanoramaPage } from "@/pages/Panorama";
import { NotFoundPage } from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="navigation" element={<NavigationPage />} />
        <Route path="panorama" element={<PanoramaPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
