import React from 'react';

const LoadingState = () => (
  <div className="space-y-6">
    <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="h-32 bg-gray-200 rounded-xl animate-pulse"
        />
      ))}
    </div>
  </div>
);

export default LoadingState;