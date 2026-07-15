import fs from "fs/promises";
import path from "path";

/**
 * Generates a unique filename using a timestamp prefix.
 * Example: "hall.jpg" -> "171950302_hall.jpg"
 */
export function generateUniqueFilename(filename: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    // Sanitize baseName to keep only safe characters (alphanumeric, dash, underscore)
    const sanitizedBase = baseName.replace(/[^a-zA-Z0-9-_]/g, "");
    return `${timestamp}_${sanitizedBase}${ext}`;
}

/**
 * Deletes a file from the disk.
 */
export async function deleteFile(filePath: string): Promise<void> {
    try {
        await fs.unlink(filePath);
    } catch (error: any) {
        if (error.code !== "ENOENT") {
            console.error(`Failed to delete file: ${filePath}`, error);
            throw error;
        }
    }
}
