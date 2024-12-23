/**
 * Converts a number of bytes into a human-readable string
 * @param {number} bytes
 * @returns {string}
 * @example formatFileSize(1024) => "1.00 KB"
 * @example formatFileSize(123456789) => "117.74 MB"
 */
export function formatFileSize(bytes: number) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    if (bytes === 0) return "n/a";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return (bytes / Math.pow(1024, i)).toFixed(2) + " " + sizes[i];
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
