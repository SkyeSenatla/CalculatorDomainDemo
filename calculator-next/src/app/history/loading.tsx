// Next.js Streaming: this file is automatically shown while the route segment loads.
// The "skeleton" UI gives instant visual feedback instead of a blank screen,
// using Tailwind's animate-pulse to mimic the final layout with gray placeholder boxes.
export default function Loading() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-6 animate-pulse space-y-4">
      {/* Skeleton for the page title */}
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      {/* Skeleton for the search bar */}
      <div className="h-12 bg-gray-200 rounded w-full"></div>
      {/* Skeleton cards mimicking the calculation list layout */}
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
    </div>
  );
}
