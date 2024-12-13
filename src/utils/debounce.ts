// Simple debounce implementation
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let latestArgs: Parameters<T> | null = null;

  const debouncedFunction = (...args: Parameters<T>) => {
    latestArgs = args;
    
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      if (latestArgs) {
        func(...latestArgs);
      }
      timeout = null;
      latestArgs = null;
    }, wait);
  };

  // Add cancel method
  debouncedFunction.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
      latestArgs = null;
    }
  };

  return debouncedFunction;
}
