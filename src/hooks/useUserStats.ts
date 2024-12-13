import { useState, useEffect } from 'react';
import ReactGA from 'react-ga4';

export function useUserStats() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  
  useEffect(() => {
    // Initialize GA4 with your measurement ID
    ReactGA.initialize('G-XXXXXXXXXX'); // Replace with your GA4 measurement ID
    
    // Track pageview
    ReactGA.send({ hitType: 'pageview', page: window.location.pathname });

    // For now, return dummy values until we implement the GA4 API
    setActiveUsers(0);
    setTotalUsers(0);
  }, []);

  return { activeUsers, totalUsers };
}
