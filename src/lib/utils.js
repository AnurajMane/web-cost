import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes without conflicts.
 * It combines 'clsx' for conditional classes and 'twMerge' to handle
 * overlapping Tailwind utilities.
 */

/**
 * The cn function is essential for your Website Cost Prediction project because:
 * Conflict Resolution: It ensures that if you apply two conflicting Tailwind classes (like p-4 and p-6) to a component, the last one always wins correctly.
 * Conditional Styling: It allows your dashboard components (like MonthlyBilling.jsx) to apply styles based on data, such as changing a badge color if a payment is "Paid" vs "Pending".
*/
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}