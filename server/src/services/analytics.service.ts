import { AnalyticsRepository } from "../repositories/analytics.repository.js";

export class AnalyticsService {
    private repository = new AnalyticsRepository();

    private parseRangeToDate(range?: string): Date | undefined {
        if (!range || range === "all") return undefined;

        const now = new Date();
        if (range === "day" || range === "today") {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            return startOfDay;
        }
        if (range === "week") {
            const lastWeek = new Date(now.setDate(now.getDate() - 7));
            return lastWeek;
        }
        if (range === "month") {
            const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
            return lastMonth;
        }
        if (range === "year") {
            const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));
            return lastYear;
        }
        return undefined;
    }

    async getOverview(range?: string) {
        const since = this.parseRangeToDate(range);
        return this.repository.getOverviewStats(since);
    }

    async getTopSearches(range?: string, limit?: number) {
        const since = this.parseRangeToDate(range);
        return this.repository.getTopSearches(limit ?? 10, since);
    }

    async getNoResults(range?: string, limit?: number) {
        const since = this.parseRangeToDate(range);
        return this.repository.getNoResultSearches(limit ?? 10, since);
    }

    async getSearchTrend(range?: string) {
        const since = this.parseRangeToDate(range);
        return this.repository.getSearchTrend(since);
    }

    async getNavigationStats(range?: string) {
        const since = this.parseRangeToDate(range);
        return this.repository.getNavigationStats(since);
    }

    async getPopularBuildings(range?: string, limit?: number) {
        const since = this.parseRangeToDate(range);
        return this.repository.getPopularBuildings(limit ?? 8, since);
    }
}
