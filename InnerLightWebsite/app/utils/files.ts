/**
 * Converts a file size in bytes to a human-readable string format.
 * @example formatFileSize(1024) => "1 KB"
 * @example formatFileSize(1048576) => "1 MB"
 * @param {number} bytes - The size of the file in bytes.
 * @returns {string} - The formatted file size as a string with the appropriate unit.
 */
export function formatFileSize(bytes: number) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    if (bytes === 0) return "n/a";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
}

/**
 * Returns true if the given file is smaller than the given max size in MB, and false otherwise
 * @example validateFileSize(new File([""], "example.txt"), 5) => true
 * @example validateFileSize(new File([""], "example.txt"), 0) => false
 * @param {File} file - the file to check
 * @param {number} maxSizeMB - the maximum size in MB
 * @returns {boolean} - true if the file is smaller than the maximum size, false otherwise
 */
export function validateFileSize(file: File, maxSizeMB: number) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const fileSize = file.size;
    if (fileSize > maxSizeBytes) {
        return false;
    }
    return true;
}

/**
 * Returns the file extension of a given filename, or undefined if there is no extension
 * @example getFileExtension("example.txt") => "txt"
 * @example getFileExtension("example") => undefined
 * @param {string} filename
 * @returns {string|undefined}
 */
export function getFileExtension(filename: string) {
    return filename.split(".").pop();
}
