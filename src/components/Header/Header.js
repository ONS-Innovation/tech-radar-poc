import React from 'react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import './Header.css';
import Logo from './logo.png';

function Header({ searchTerm, onSearchChange, searchResults, onSearchResultClick }) {
  return (
    <header className="radar-header">
      <div className="header-left">
        <img src={Logo} alt="Logo" className="logo"/>
        {/* <h1> Tech Radar</h1> */}
      </div>
      <div className="header-right">
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search technologies..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div
                  key={result.id}
                  className="search-result-item"
                  onClick={() => onSearchResultClick(result)}
                >
                  <span className="search-result-title">{result.title}</span>
                  <span className={`search-result-ring ${result.timeline[0].ringId.toLowerCase()}`}>
                    {result.timeline[0].ringId}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header; 