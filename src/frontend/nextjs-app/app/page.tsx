// This page is handled by middleware.ts which redirects to either /login or /demand-planning
// based on authentication status. This component should never render.
export default function HomePage() {
  return null;
}
