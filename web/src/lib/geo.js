// Asks the browser for location permission once. Never throws.
export function requestLocation(timeoutMs = 15000) {
  const geo = globalThis.navigator?.geolocation;
  if (!geo?.getCurrentPosition) return Promise.resolve('unavailable');
  return new Promise((resolve) => {
    geo.getCurrentPosition(
      () => resolve('granted'),
      (err) => resolve(err?.code === 1 ? 'denied' : 'unavailable'),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 600000 },
    );
  });
}
