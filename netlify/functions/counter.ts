import { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Return zeros in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

const COUNTER_KEY = 'visits';
const ACTIVE_USERS_KEY = 'active_users';
const ACTIVE_USER_TIMEOUT = 5 * 60 * 1000; // 5 minutes

interface UserTimestamp {
  timestamp: number;
}

export const handler: Handler = async (event) => {
  if (isDevelopment) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        visits: 0,
        activeUsers: 0
      })
    };
  }

  try {
    const store = getStore('counter');
    
    // Get current counts
    const visitsStr = await store.get(COUNTER_KEY) || '0';
    const visits = parseInt(visitsStr);
    
    // Get and clean active users
    const activeUsersStr = await store.get(ACTIVE_USERS_KEY) || '{}';
    const activeUsers: Record<string, UserTimestamp> = JSON.parse(activeUsersStr);
    
    const now = Date.now();
    // Clean up inactive users
    Object.keys(activeUsers).forEach(id => {
      if (now - activeUsers[id].timestamp > ACTIVE_USER_TIMEOUT) {
        delete activeUsers[id];
      }
    });
    
    // Update current user's timestamp
    const userId = event.headers['client-id'] || 'anonymous';
    activeUsers[userId] = { timestamp: now };
    
    // Save updated counts
    await store.set(COUNTER_KEY, (visits + 1).toString());
    await store.set(ACTIVE_USERS_KEY, JSON.stringify(activeUsers));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        visits: visits + 1,
        activeUsers: Object.keys(activeUsers).length
      })
    };
  } catch (error) {
    console.error('Counter error:', error);
    // On any error, also return zeros
    return {
      statusCode: 200,
      body: JSON.stringify({
        visits: 0,
        activeUsers: 0
      })
    };
  }
};
