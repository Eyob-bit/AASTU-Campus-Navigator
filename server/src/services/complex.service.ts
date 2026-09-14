import { ComplexRepository } from "../repositories/complex.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { ConnectionType } from "@prisma/client";

export class ComplexService {
    private repository = new ComplexRepository();

    async getComplexes() {
        return this.repository.findAll();
    }

    async getComplex(id: string) {
        const complex = await this.repository.findById(id);
        if (!complex) {
            throw new ApiError(404, "Building complex not found");
        }
        return complex;
    }

    async createComplex(data: {
        name: string;
        code: string;
        description?: string;
        zone?: string;
        coverImage?: string;
    }) {
        const existing = await this.repository.findByCode(data.code);
        if (existing) {
            throw new ApiError(409, `A complex with code "${data.code}" already exists`);
        }
        return this.repository.create(data);
    }

    async updateComplex(
        id: string,
        data: {
            name?: string;
            code?: string;
            description?: string;
            zone?: string;
            coverImage?: string;
            isActive?: boolean;
        }
    ) {
        const complex = await this.repository.findById(id);
        if (!complex) {
            throw new ApiError(404, "Building complex not found");
        }
        return this.repository.update(id, data);
    }

    async deleteComplex(id: string) {
        const complex = await this.repository.findById(id);
        if (!complex) {
            throw new ApiError(404, "Building complex not found");
        }
        return this.repository.delete(id);
    }

    // ── Connections ──────────────────────────────────────────────────────────
    async getConnections(complexId?: string) {
        return this.repository.findAllConnections(complexId);
    }

    async createConnection(data: {
        name: string;
        type?: ConnectionType;
        fromBuildingId: string;
        toBuildingId: string;
        fromFloorId?: string | null;
        toFloorId?: string | null;
        fromSceneId?: string | null;
        toSceneId?: string | null;
        description?: string | null;
        isWalkable?: boolean;
        complexId?: string | null;
    }) {
        return this.repository.createConnection(data);
    }

    async deleteConnection(id: string) {
        return this.repository.deleteConnection(id);
    }
}
