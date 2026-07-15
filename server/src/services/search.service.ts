import { SearchRepository } from "../repositories/search.repository.js";
import { mapToSearchResultDTO, SearchResultDTO } from "../dto/search-result.dto.js";
import { ApiError } from "../utils/ApiError.js";

interface StrategyMatch {
    type: "staff" | "office";
    building: any;
    floor: any;
    office: any;
    staff: any | null;
}

export class SearchService {
    private repository = new SearchRepository();

    async search(query: string): Promise<SearchResultDTO[]> {
        // Normalize: trim, lowercase, and collapse multiple spaces
        const normalized = query
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

        if (!normalized) {
            throw new ApiError(400, "Search query must not be empty");
        }

        const strategies = [
            () => this.searchRoom(normalized),
            () => this.searchOffice(normalized),
            () => this.searchStaffByName(normalized),
            () => this.searchStaffByPosition(normalized),
            () => this.searchAlias(normalized),
        ];

        for (const strategy of strategies) {
            const matches = await strategy();
            if (matches && matches.length > 0) {
                // Initialize request-level Promise caches to prevent redundant queries
                const entrySceneCache = new Map<string, Promise<any>>();
                const destinationSceneCache = new Map<string, Promise<any>>();

                return Promise.all(
                    matches.map(async (match) => {
                        const floorId = match.floor.id;
                        const officeId = match.office.id;

                        let entryScenePromise = entrySceneCache.get(floorId);
                        if (!entryScenePromise) {
                            entryScenePromise = this.repository.findEntryScene(floorId);
                            entrySceneCache.set(floorId, entryScenePromise);
                        }

                        let destinationScenePromise = destinationSceneCache.get(officeId);
                        if (!destinationScenePromise) {
                            destinationScenePromise = this.repository.findOfficeScene(officeId);
                            destinationSceneCache.set(officeId, destinationScenePromise);
                        }

                        const [entryScene, destinationScene] = await Promise.all([
                            entryScenePromise,
                            destinationScenePromise,
                        ]);

                        return mapToSearchResultDTO(
                            match.type,
                            match.building,
                            match.floor,
                            match.office,
                            match.staff,
                            entryScene,
                            destinationScene
                        );
                    })
                );
            }
        }

        throw new ApiError(404, "No matching campus entities found");
    }

    private async searchRoom(normalized: string): Promise<StrategyMatch[] | null> {
        const offices = await this.repository.findOfficeByRoomNumber(normalized);
        if (!offices || offices.length === 0) return null;

        return offices.map(office => ({
            type: "office",
            building: office.floor.building,
            floor: office.floor,
            office,
            staff: null,
        }));
    }

    private async searchOffice(normalized: string): Promise<StrategyMatch[] | null> {
        const offices = await this.repository.findOfficeByName(normalized);
        if (!offices || offices.length === 0) return null;

        return offices.map(office => ({
            type: "office",
            building: office.floor.building,
            floor: office.floor,
            office,
            staff: null,
        }));
    }

    private async searchStaffByName(normalized: string): Promise<StrategyMatch[] | null> {
        const staffList = await this.repository.findStaffByName(normalized);
        if (!staffList || staffList.length === 0) return null;

        return staffList.map(staff => ({
            type: "staff",
            building: staff.office.floor.building,
            floor: staff.office.floor,
            office: staff.office,
            staff,
        }));
    }

    private async searchStaffByPosition(normalized: string): Promise<StrategyMatch[] | null> {
        const staffList = await this.repository.findStaffByPosition(normalized);
        if (!staffList || staffList.length === 0) return null;

        return staffList.map(staff => ({
            type: "staff",
            building: staff.office.floor.building,
            floor: staff.office.floor,
            office: staff.office,
            staff,
        }));
    }

    private async searchAlias(normalized: string): Promise<StrategyMatch[] | null> {
        const aliases = await this.repository.findAlias(normalized);
        if (!aliases || aliases.length === 0) return null;

        return aliases.map(alias => {
            if (alias.staff) {
                return {
                    type: "staff",
                    building: alias.staff.office.floor.building,
                    floor: alias.staff.office.floor,
                    office: alias.staff.office,
                    staff: alias.staff,
                };
            }

            if (!alias.office) {
                throw new ApiError(500, "Search alias is corrupted.");
            }

            return {
                type: "office",
                building: alias.office.floor.building,
                floor: alias.office.floor,
                office: alias.office,
                staff: null,
            };
        });
    }
}
