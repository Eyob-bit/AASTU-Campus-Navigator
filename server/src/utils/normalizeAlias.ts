export function normalizeAlias(alias: string): string {
    return alias
        .trim()
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .toLowerCase();
}
