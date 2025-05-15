/**
 * Formats a duration in seconds to a human-readable time string (MM:SS)
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Converts a time string (MM:SS) to seconds
 */
export function timeStringToSeconds(timeString: string): number {
  const [minutes, seconds] = timeString.split(":").map(Number);
  return minutes * 60 + seconds;
}

/**
 * Formats a date to a human-readable string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Creates a time elapsed string from a completion time
 */
export function formatCompletionTime(timeString: string): string {
  const [minutes, seconds] = timeString.split(":").map(Number);
  
  if (minutes === 0) {
    return `${seconds} sec`;
  }
  
  return `${minutes} min ${seconds} sec`;
}

/**
 * Gets time elapsed in seconds from a start time
 */
export function getElapsedTime(startTime: number): number {
  return Math.floor((Date.now() - startTime) / 1000);
}
