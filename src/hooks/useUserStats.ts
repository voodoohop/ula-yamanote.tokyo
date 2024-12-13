import { useState, useEffect } from 'react';

export function useUserStats() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  
  useEffect(() => {
    let isActive = true;

    // Initialize counters
    const initCounts = async () => {
      try {
        // Increment total visits
        await fetch('/.netlify/functions/counter?action=increment-total');
        
        // Increment active users
        await fetch('/.netlify/functions/counter?action=increment-active');
        
        // Get current counts
        const response = await fetch('/.netlify/functions/counter?action=get');
        const data = await response.json();
        if (isActive) {
          setTotalUsers(data.totalVisits);
          setActiveUsers(data.activeUsers);
        }
      } catch (error) {
        console.error('Error initializing counts:', error);
      }
    };

    initCounts();

    // Poll for updates every 3 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/.netlify/functions/counter?action=get');
        const data = await response.json();
        if (isActive) {
          setActiveUsers(data.activeUsers);
          setTotalUsers(data.totalVisits);
        }
      } catch (error) {
        console.error('Error updating counts:', error);
      }
    }, 3000);

    // Cleanup function
    const cleanup = async () => {
      try {
        await fetch('/.netlify/functions/counter?action=decrement-active');
      } catch (error) {
        console.error('Error cleaning up:', error);
      }
    };

    // Add event listeners for cleanup
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('unload', cleanup);

    return () => {
      isActive = false;
      clearInterval(interval);
      window.removeEventListener('beforeunload', cleanup);
      window.removeEventListener('unload', cleanup);
      cleanup();
    };
  }, []);

  return { activeUsers, totalUsers };
}
