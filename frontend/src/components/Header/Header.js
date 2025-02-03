import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MenuDropdown from "../MenuDropdown/MenuDropdown";
import HelpModal from "./HelpModal";
import "../../styles/components/Header.css";
import Logo from "../../assets/logo.png";
import { IoClose, IoSearch, IoHelp } from "react-icons/io5";
import ThemeToggle from '../ThemeToggle/ThemeToggle';

/**
 * Header component for the Tech Radar application.
 * 
 * This component renders the header section of the application, including the logo, search bar, 
 * file upload functionality, and theme toggle.
 * 
 * @param {Object} props - The props passed to the Header component.
 * @param {string} props.searchTerm - The current search term.
 * @param {Function} props.onSearchChange - Function to call when the search term changes.
 * @param {Array} props.searchResults - Array of search results.
 * @param {Function} props.onSearchResultClick - Function to call when a search result is clicked.
 * @param {Function} props.onFileUpload - Function to call when a file is uploaded.
 * @param {Function} props.checkForDuplicates - Function to call to check for duplicates.
 * @param {Function} props.onOpenProjects - Function to call when the projects button is clicked.
 * @param {Function} props.onStatsTechClick - Function to call when a technology is clicked.
 * @param {boolean} props.hideSearch - Whether to hide the search bar.
 */
function Header({
  searchTerm = "",
  onSearchChange = () => {},
  searchResults = [],
  onSearchResultClick = () => {},
  onOpenProjects = () => {},
  onStatsTechClick = () => {},
  hideSearch = false
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelpModal, setShowHelpModal] = useState(false);

  /**
   * Clears the search term.
   */
  const clearSearch = () => {
    onSearchChange("");
  };

  const handleSetShowHelpModal = () => {
    setShowHelpModal(!showHelpModal)
  }

  return (
    <header className="radar-header">
      <div className="header-left">
        <img 
          src={Logo} 
          alt="Logo" 
          className="logo" 
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        />
        <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Digital Landscape</h1>
        <nav className="desktop-nav">
          <button 
            onClick={() => navigate('/radar')} 
            className={location.pathname === '/radar' ? 'active' : ''}
          >
            Tech Radar
          </button>
          <button 
            onClick={() => navigate('/statistics')} 
            className={location.pathname === '/statistics' ? 'active' : ''}
          >
            Statistics
          </button>
          <button 
            onClick={() => navigate('/projects')} 
            className={location.pathname === '/projects' ? 'active' : ''}
          >
            Projects
          </button>
          <button 
            onClick={() => handleSetShowHelpModal()}
          >
            Help
          </button>
        </nav>
      </div>
      <div className="header-right">
        {!hideSearch && (
          <div className="search-container">
            <IoSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search technologies..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            <button
              className="search-clear"
              onClick={clearSearch}
              style={{ display: searchTerm ? "block" : "none" }}
            >
              <IoClose />
            </button>
            {searchResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="search-result-item"
                    onClick={() => onSearchResultClick(result)}
                  >
                    <span className="search-result-title">{result.title}</span>
                    <span
                      className={`search-result-ring ${result.timeline[result.timeline.length - 1].ringId.toLowerCase()}`}
                    >
                      {result.timeline[result.timeline.length - 1].ringId}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="mobile-menu">
          <MenuDropdown 
            onOpenProjects={onOpenProjects} 
            onStatsTechClick={onStatsTechClick}
            setShowHelpModal={handleSetShowHelpModal}
          />
        </div>
        <ThemeToggle />
        <HelpModal show={showHelpModal} onClose={() => handleSetShowHelpModal()} />
      </div>
    </header>
  );
}

export default Header;
