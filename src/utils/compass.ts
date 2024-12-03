export function checkCompassSupport(): Promise<boolean> {
  if (!window.DeviceOrientationEvent) {
    return Promise.resolve(false);
  }

  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    // iOS 13+ devices
    return DeviceOrientationEvent.requestPermission()
      .then(response => {
        if (response === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
          return true;
        }
        return false;
      })
      .catch(() => false);
  } 
  
  // Non iOS devices
  window.addEventListener('deviceorientation', handleOrientation);
  return Promise.resolve(true);
}

export function handleOrientation(event: DeviceOrientationEvent) {
  let heading: number | null = null;
  
  try {
    if ('webkitCompassHeading' in event) {
      // iOS devices - this is already correct
      heading = event.webkitCompassHeading as number;
    } else if (event.alpha !== null) {
      // Android devices - simplified handling
      heading = 360 - event.alpha;
    }
    
    if (heading !== null) {
      updateCompass(heading);
    }
  } catch (error) {
    console.error('Compass error:', error);
  }
}

function updateCompass(heading: number) {
  const arrow = document.querySelector('.compass-arrow');
  if (arrow) {
    arrow.setAttribute('style', 
      `transform: translate(-50%, -100%) rotate(${heading}deg); 
       transition: transform 0.2s ease-out;`
    );
  }
}

export function calculateBearing(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const dLon = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
          Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}