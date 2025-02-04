import React from "react";
import "../../../styles/components/SkeletonLoading.css";

function SkeletonStatCard() {
  return (
    <div className="stat-card skeleton">
      <div className="skeleton-title"></div>
      <div className="skeleton-value"></div>
    </div>
  );
}

export default SkeletonStatCard;
