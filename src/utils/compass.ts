export function checkCompassSupport(): Promise<boolean> {
  if (window.DeviceOrientationEvent) {
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
    } else {
      // Non iOS 13+ devices
      window.addEventListener('deviceorientation', handleOrientation);
      return Promise.resolve(true);
    }
  }
  return Promise.resolve(false);
}

export function handleOrientation(event: DeviceOrientationEvent) {
  let heading: number;
  
  if ('webkitCompassHeading' in event) {
    // iOS devices
    heading = event.webkitCompassHeading as number;
  } else if (event.alpha) {
    // Android devices
    heading = 360 - event.alpha;
  } else {
    return;
  }
  
  updateCompass(heading);
}

function updateCompass(heading: number) {
  const arrow = document.querySelector('.compass-arrow');
  if (arrow) {
    arrow.style.transform = `translateX(-50%) rotate(${heading}deg)`;
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