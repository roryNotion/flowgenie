import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return 'Unknown date';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return 'Unknown date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(dateObj);
  } catch (error) {
    return 'Unknown date';
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getNodeColor(type: string): string {
  switch (type) {
    case 'trigger':
      return 'rgb(239, 68, 68)'; // error-500
    case 'condition':
      return 'rgb(234, 179, 8)'; // warning-500
    case 'aiblock':
      return 'rgb(79, 70, 229)'; // primary-600  
    case 'action':
      return 'rgb(13, 148, 136)'; // secondary-600
    default:
      return 'rgb(107, 114, 128)'; // gray-500
  }
}

export function getNodeIcon(type: string) {
  switch (type) {
    case 'trigger':
      return 'Zap';
    case 'condition':
      return 'GitBranch';
    case 'aiblock':
      return 'Brain';
    case 'action':
      return 'Send';
    default:
      return 'Circle';
  }
}

export function getIntegrationIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'supabase':
      return 'Database';
    case 'openai':
      return 'Brain';
    case 'sendgrid':
    case 'resend':
      return 'Mail';
    default:
      return 'Puzzle';
  }
}

export function parseJsonSafely(jsonString: string) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return null;
  }
}

export function isValidJson(json: string): boolean {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
}