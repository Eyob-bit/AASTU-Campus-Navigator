import { prisma } from "../config/prisma.js";

export class AnalyticsRepository {
    async getOverviewStats(since?: Date) {
        const dateFilter = since ? { createdAt: { gte: since } } : {};
        const navDateFilter = since ? { startedAt: { gte: since } } : {};

        const [
            totalSearches,
            noResultCount,
            totalNavigations,
            completedNavigations,
            buildingCount,
            officeCount,
            aliasCount,
        ] = await Promise.all([
            prisma.searchLog.count({ where: dateFilter }),
            prisma.searchLog.count({ where: { ...dateFilter, hasResults: false } }),
            prisma.navigationLog.count({ where: navDateFilter }),
            prisma.navigationLog.count({ where: { ...navDateFilter, completedAt: { not: null }, cancelled: false } }),
            prisma.building.count({ where: { isActive: true } }),
            prisma.office.count({ where: { isActive: true } }),
            prisma.searchAlias.count(),
        ]);

        const searchSuccessRate = totalSearches > 0
            ? Math.round(((totalSearches - noResultCount) / totalSearches) * 100)
            : 100;

        const navSuccessRate = totalNavigations > 0
            ? Math.round((completedNavigations / totalNavigations) * 100)
            : 100;

        return {
            totalSearches,
            noResultCount,
            searchSuccessRate,
            totalNavigations,
            completedNavigations,
            navSuccessRate,
            buildingCount,
            officeCount,
            aliasCount,
        };
    }

    async getTopSearches(limit: number = 10, since?: Date) {
        const dateFilter = since ? { createdAt: { gte: since } } : {};

        const grouped = await prisma.searchLog.groupBy({
            by: ["query"],
            where: {
                ...dateFilter,
                hasResults: true,
            },
            _count: {
                query: true,
            },
            orderBy: {
                _count: {
                    query: "desc",
                },
            },
            take: limit,
        });

        return grouped.map((g) => ({
            query: g.query,
            count: g._count.query,
        }));
    }

    async getNoResultSearches(limit: number = 10, since?: Date) {
        const dateFilter = since ? { createdAt: { gte: since } } : {};

        const grouped = await prisma.searchLog.groupBy({
            by: ["query"],
            where: {
                ...dateFilter,
                hasResults: false,
            },
            _count: {
                query: true,
            },
            orderBy: {
                _count: {
                    query: "desc",
                },
            },
            take: limit,
        });

        return grouped.map((g) => ({
            query: g.query,
            count: g._count.query,
        }));
    }

    async getSearchTrend(since?: Date) {
        const dateFilter = since ? { createdAt: { gte: since } } : {};
        const logs = await prisma.searchLog.findMany({
            where: dateFilter,
            select: { createdAt: true, hasResults: true },
            orderBy: { createdAt: "asc" },
        });

        const dayMap = new Map<string, { total: number; successful: number; failed: number }>();

        logs.forEach((log) => {
            const dayKey = log.createdAt.toISOString().split("T")[0];
            const current = dayMap.get(dayKey) || { total: 0, successful: 0, failed: 0 };
            current.total += 1;
            if (log.hasResults) {
                current.successful += 1;
            } else {
                current.failed += 1;
            }
            dayMap.set(dayKey, current);
        });

        return Array.from(dayMap.entries()).map(([date, counts]) => ({
            date,
            ...counts,
        }));
    }

    async getNavigationStats(since?: Date) {
        const dateFilter = since ? { startedAt: { gte: since } } : {};

        const [total, completed, cancelled] = await Promise.all([
            prisma.navigationLog.count({ where: dateFilter }),
            prisma.navigationLog.count({ where: { ...dateFilter, completedAt: { not: null }, cancelled: false } }),
            prisma.navigationLog.count({ where: { ...dateFilter, cancelled: true } }),
        ]);

        const active = total - completed - cancelled;

        return {
            total,
            completed,
            cancelled,
            active: Math.max(0, active),
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 100,
        };
    }

    async getPopularBuildings(limit: number = 8, since?: Date) {
        const dateFilter = since ? { startedAt: { gte: since } } : {};

        const grouped = await prisma.navigationLog.groupBy({
            by: ["destinationName"],
            where: {
                ...dateFilter,
                destinationName: { not: null },
            },
            _count: {
                destinationName: true,
            },
            orderBy: {
                _count: {
                    destinationName: "desc",
                },
            },
            take: limit,
        });

        return grouped.map((g) => ({
            buildingName: g.destinationName ?? "Unknown Destination",
            visits: g._count.destinationName,
        }));
    }
}
