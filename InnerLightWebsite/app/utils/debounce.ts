

/**
 * Creates a debounced function that delays invoking the provided function 
 * until after the specified wait time has elapsed since the last time 
 * the debounced function was invoked.
 * 
 * @template T - The type of the function to debounce.
 * @param {T} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to delay.
 * @returns {(...args: Parameters<T>) => ReturnType<T>} - Returns the new debounced function.
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number) : (...args: Parameters<T>) => ReturnType<T> {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        return new Promise<ReturnType<T>>((resolve) => {
            timeout = setTimeout(() => {
                resolve(func(...args));
            }, wait);
        }) as ReturnType<T>;
    }
}