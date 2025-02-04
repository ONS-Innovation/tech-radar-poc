import React from 'react';
import "../../../styles/components/SkeletonLoading.css";

function SkeletonStatCard({minWidth = "0"}) {
  return (
    <div className="stat-card skeleton" style={{ minWidth: minWidth }}>
      <div className="skeleton-title"></div>
      <div className="skeleton-value"></div>
    </div>
  );
}

export default SkeletonStatCard; 