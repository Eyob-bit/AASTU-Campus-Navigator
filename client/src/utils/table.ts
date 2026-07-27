/**
 * Pagination helpers — pure functions used by all admin CRUD pages.
 * These replace the inline Math.ceil / Array.slice patterns that were
 * duplicated in every page component.
 */

export function getTotalPages(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}
