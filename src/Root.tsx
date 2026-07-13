import { lazy, Suspense } from 'react';
import App from './App';

const DenshaExperience = lazy(() => import('./three/DenshaExperience').then((module) => ({
  default: module.DenshaExperience,
})));

export function Root() {
  const path = window.location.pathname.replace(/\/$/, '');

  if (path !== '/3d') return <App />;

  return (
    <Suspense fallback={<div className="route-loading">LOADING 3D LOOP</div>}>
      <DenshaExperience />
    </Suspense>
  );
}
