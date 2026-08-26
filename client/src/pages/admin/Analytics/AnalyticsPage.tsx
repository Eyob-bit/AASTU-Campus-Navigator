import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Search,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Download,
  Calendar,
  RefreshCw,
  Plus,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { Card, Button, Skeleton } from "@/components/ui";
import {
  analyticsApi,
  type AnalyticsOverview,
  type TopSearchItem,
  type SearchTrendItem,
  type NavigationStats,
  type PopularBuildingItem,
} from "@/api/analytics.api";
import { useNavigate } from "react-router-dom";

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState<string>("week");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [topSearches, setTopSearches] = useState<TopSearchItem[]>([]);
  const [noResults, setNoResults] = useState<TopSearchItem[]>([]);
  const [trend, setTrend] = useState<SearchTrendItem[]>([]);
  const [navStats, setNavStats] = useState<NavigationStats | null>(null);
  const [popularBuildings, setPopularBuildings] = useState<PopularBuildingItem[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ovRes, topRes, noRes, trendRes, navRes, popRes] = await Promise.allSettled([
        analyticsApi.getOverview(range),
        analyticsApi.getTopSearches(range, 8),
        analyticsApi.getNoResults(range, 8),
        analyticsApi.getSearchTrend(range),
        analyticsApi.getNavigationStats(range),
        analyticsApi.getPopularBuildings(range, 6),
      ]);

      if (ovRes.status === "fulfilled") setOverview(ovRes.value);
      if (topRes.status === "fulfilled") setTopSearches(topRes.value);
      if (noRes.status === "fulfilled") setNoResults(noRes.value);
      if (trendRes.status === "fulfilled") setTrend(trendRes.value);
      if (navRes.status === "fulfilled") setNavStats(navRes.value);
      if (popRes.status === "fulfilled") setPopularBuildings(popRes.value);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  function exportCSV() {
    let csv = "Metric,Value\n";
    if (overview) {
      csv += `Total Searches,${overview.totalSearches}\n`;
      csv += `No-Result Searches,${overview.noResultCount}\n`;
      csv += `Search Success Rate,${overview.searchSuccessRate}%\n`;
      csv += `Total Navigations,${overview.totalNavigations}\n`;
      csv += `Navigation Success Rate,${overview.navSuccessRate}%\n`;
    }
    csv += "\nTop Searches,Count\n";
    topSearches.forEach((s) => {
      csv += `"${s.query}",${s.count}\n`;
    });
    csv += "\nNo-Result Queries,Count\n";
    noResults.forEach((s) => {
      csv += `"${s.query}",${s.count}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `aastu_analytics_${range}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const maxSearchCount = Math.max(...topSearches.map((s) => s.count), 1);
  const maxBuildingVisits = Math.max(...popularBuildings.map((b) => b.visits), 1);
  const maxTrendTotal = Math.max(...trend.map((t) => t.total), 1);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-4 sm:px-8 py-6 sm:py-8 flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="text-indigo-600 dark:text-indigo-400" size={24} />
            System Analytics & Insights
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            Track user search trends, navigation completion rates, popular destinations, and zero-result queries.
          </p>
        </div>

        {/* Filters + Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Time range selector */}
          <div className="inline-flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300">
            {(["today", "week", "month", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer capitalize ${
                  range === r ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm font-bold" : "hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {r === "today" ? "Today" : r === "week" ? "Last 7 Days" : r === "month" ? "Last 30 Days" : "All Time"}
              </button>
            ))}
          </div>

          <Button
            onClick={exportCSV}
            variant="outline"
            className="text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Download size={14} />
            Export CSV
          </Button>

          <Button
            onClick={() => loadData()}
            variant="ghost"
            className="p-2 rounded-xl text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6 sm:space-y-8 flex-1">
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <Button onClick={() => loadData()} className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline">
              Retry
            </Button>
          </div>
        )}

        {/* Section 1: Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className="p-5 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Total Searches</span>
              <Search size={18} className="text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {isLoading ? <Skeleton className="h-8 w-16" /> : overview?.totalSearches ?? 0}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Queries logged across campus</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Search Accuracy</span>
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {isLoading ? <Skeleton className="h-8 w-16" /> : `${overview?.searchSuccessRate ?? 100}%`}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Result match rate</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-indigo-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Navigations</span>
              <Navigation size={18} className="text-indigo-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {isLoading ? <Skeleton className="h-8 w-16" /> : overview?.totalNavigations ?? 0}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">Routes generated</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Active Entities</span>
              <Building2 size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-2">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `${overview?.buildingCount ?? 0} Bldgs • ${overview?.officeCount ?? 0} Off`
              )}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">{overview?.aliasCount ?? 0} active search aliases</p>
          </Card>
        </div>

        {/* Section 2 & 3: Top Searches & Search Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Top Searches Bar Chart */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-800 pb-3">
              <TrendingUp size={16} className="text-blue-600 dark:text-blue-400" />
              Top Search Queries
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : topSearches.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 py-8 text-center">No search queries recorded for this timeframe yet.</p>
            ) : (
              <div className="space-y-3.5">
                {topSearches.map((item, idx) => {
                  const pct = Math.round((item.count / maxSearchCount) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-200">
                        <span className="truncate max-w-[200px]">{item.query}</span>
                        <span className="font-mono text-gray-500 dark:text-slate-400">{item.count} searches</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Search Trend */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-800 pb-3">
              <Calendar size={16} className="text-indigo-600 dark:text-indigo-400" />
              Daily Activity Trend
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : trend.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 py-8 text-center">No trend activity logged yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="h-40 flex items-end justify-between gap-1 sm:gap-2 pt-6 border-b border-gray-100 dark:border-slate-800">
                  {trend.map((t, i) => {
                    const heightPct = Math.round((t.total / maxTrendTotal) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="w-full flex flex-col justify-end items-center h-32">
                          <div
                            className="w-full max-w-[24px] bg-indigo-500 hover:bg-indigo-600 rounded-t-md transition-all group-hover:scale-105"
                            style={{ height: `${Math.max(8, heightPct)}%` }}
                            title={`${t.date}: ${t.total} queries (${t.successful} success)`}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono rotate-[-45px] sm:rotate-0 truncate">
                          {t.date.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Query Volume
                  </span>
                  <span>Daily distribution</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Section 4 & 5: Navigation Stats & Popular Buildings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Navigation Completion (Pie / Segment Breakdown) */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-800 pb-3">
              <Navigation size={16} className="text-emerald-600 dark:text-emerald-400" />
              Navigation Completion Breakdown
            </h3>

            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                {/* Visual donut ring representation */}
                <div className="relative w-32 h-32 rounded-full border-8 border-emerald-500 flex items-center justify-center bg-emerald-50/30 dark:bg-emerald-950/30">
                  <div className="text-center">
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                      {navStats?.completionRate ?? 100}%
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 font-semibold uppercase">Success Rate</p>
                  </div>
                </div>

                <div className="space-y-3 w-full sm:w-auto text-xs">
                  <div className="flex items-center justify-between gap-4 p-2.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl">
                    <span className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-medium">
                      <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" /> Completed
                    </span>
                    <span className="font-mono font-bold text-emerald-900 dark:text-emerald-200">{navStats?.completed ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-2.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl">
                    <span className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                      <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" /> Cancelled / Left
                    </span>
                    <span className="font-mono font-bold text-amber-900 dark:text-amber-200">{navStats?.cancelled ?? 0}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-2.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl">
                    <span className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-medium">
                      <Navigation size={15} className="text-blue-600 dark:text-blue-400" /> Total Route Sessions
                    </span>
                    <span className="font-mono font-bold text-blue-900 dark:text-blue-200">{navStats?.total ?? 0}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Popular Buildings */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-800 pb-3">
              <Building2 size={16} className="text-amber-600 dark:text-amber-400" />
              Most Navigated Destinations
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : popularBuildings.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500 py-8 text-center">No destination visits logged yet.</p>
            ) : (
              <div className="space-y-3">
                {popularBuildings.map((b, idx) => {
                  const pct = Math.round((b.visits / maxBuildingVisits) * 100);
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-200">
                        <span className="truncate">{b.buildingName}</span>
                        <span className="font-mono text-gray-500 dark:text-slate-400">{b.visits} visits</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Section 6: Zero-Result Queries */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <XCircle size={16} className="text-red-500" />
                "No Result" Search Queries ⭐
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Terms users searched for that didn't match any official office or staff name. Create an alias to fix them!
              </p>
            </div>
            <Button
              onClick={() => navigate("/dashboard/aliases")}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-medium cursor-pointer"
            >
              <Plus size={14} className="mr-1 inline" />
              Manage Aliases
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : noResults.length === 0 ? (
            <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl">
              ✓ Zero failed searches reported for this timeframe! All queries matched official destinations or aliases.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {noResults.map((nr, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-800/60 rounded-xl flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold text-red-900 dark:text-red-300 truncate">"{nr.query}"</p>
                    <p className="text-[10px] text-red-600 dark:text-red-400 font-semibold">{nr.count} failed searches</p>
                  </div>
                  <Button
                    onClick={() => navigate(`/dashboard/aliases`)}
                    size="sm"
                    className="text-[10px] bg-white dark:bg-slate-800 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 px-2 py-1 rounded-lg flex-shrink-0 cursor-pointer font-bold"
                  >
                    + Alias
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
