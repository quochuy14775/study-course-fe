import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Ghép class có điều kiện + gộp class Tailwind trùng (class sau thắng). */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
