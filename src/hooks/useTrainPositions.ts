import { useState, useEffect } from 'react';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

const REALTIME_API_URL = 'https://api-challenge2024.odpt.org/api/v4/gtfs/realtime/jreast_odpt_train_vehicle?acl:consumerKey=4i3bbqxkgcyvglm70fhwul6nkviw5166um5hi24qgbi5ls20zxasdr7n66zvy2nh';
const REFRESH_INTERVAL = 5000; // 5 seconds

export const useTrainPositions = () => {
  const [trainPositions, setTrainPositions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch real-time positions
  useEffect(() => {
    const fetchTrainPositions = async () => {
      try {
        const response = await fetch(REALTIME_API_URL);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
          new Uint8Array(buffer)
        );

        const positions = feed.entity
          .map(entity => {
            // Filter for trains with IDs ending in 'G' (Yamanote line)
            if (entity.vehicle && entity.id.endsWith('G')) {
              return {
                id: entity.id,
                timestamp: entity.vehicle.timestamp,
                tripId: entity.vehicle.trip?.tripId,
                position: entity.vehicle.position,
                currentStopSequence: entity.vehicle.currentStopSequence,
                status: entity.vehicle.currentStatus,
              };
            }
            return null;
          })
          .filter(Boolean);

        console.log('Yamanote line trains:', positions);
        setTrainPositions(positions);
      } catch (err) {
        console.error('Error fetching train positions:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch train positions');
      }
    };

    // Initial fetch
    fetchTrainPositions();

    // Set up polling every 5 seconds
    const interval = setInterval(fetchTrainPositions, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { trainPositions, error };
};
