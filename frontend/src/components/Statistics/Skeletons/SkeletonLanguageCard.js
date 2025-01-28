import React from 'react';
import "../../../styles/components/SkeletonLoading.css";

function SkeletonLanguageCard() {
  return (
    <div className="language-card skeleton">
      <div className="skeleton-language-title"></div>
      <div className="skeleton-language-stats">
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
      </div>
    </div>
  );
}

export default SkeletonLanguageCard; 