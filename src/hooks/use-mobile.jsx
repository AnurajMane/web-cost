import { useState, useEffect } from 'react';

/**
 * Hook to detect if the current viewport is mobile-sized (less than 768px).
 * Used primarily for responsive layout adjustments in the Sidebar and Header.
 * Returns a boolean indicating if the device is mobile or not.
 * Listens to window resize events to update the state accordingly.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const MOBILE_BREAKPOINT = 768;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check on mount
    checkMobile();

    // Event listener for window resizing
    window.addEventListener('resize', checkMobile);

    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}