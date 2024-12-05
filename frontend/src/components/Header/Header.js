import React from 'react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import FileUpload from './FileUpload';
import './Header.css';
import Logo from './logo.png';
import { IoClose } from "react-icons/io5";


function Header({ 
  searchTerm, 
  onSearchChange, 
  searchResults, 
  onSearchResultClick, 
  onFileUpload,
  checkForDuplicates 
}) {
  const clearSearch = () => {
    onSearchChange('');
  };
  return (
    <header className="radar-header">
      <div className="header-left">
        <img src={Logo} alt="Logo" className="logo"/>
        <h1>Tech Radar</h1>
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
          <button className="search-clear" onClick={clearSearch} style={{ display: searchTerm ? 'block' : 'none' }}> <IoClose /> </button>
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
        
        <FileUpload 
          onFileUpload={onFileUpload}
          checkForDuplicates={checkForDuplicates}
        />
        
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header; 