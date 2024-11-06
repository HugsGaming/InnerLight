export function formatFileSize(bytes: number) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    if (bytes === 0) return "n/a";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
}

export function validateFileSize(file: File, maxSizeMB: number) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const fileSize = file.size;
    if (fileSize > maxSizeBytes) {
        return false;
    }
    return true;
}