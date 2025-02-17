import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
  const searchInputRef = useRef(null);
  const [shortcutKey, setShortcutKey] = useState('⌘');

  useEffect(() => {
    // More reliable OS detection
    const userAgent = navigator.userAgent.toLowerCase();
    const isMac = /macintosh|macintel|macppc|mac68k|darwin/i.test(userAgent);
    setShortcutKey(isMac ? '⌘' : 'CTRL');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Clears the search term.
   */
  const clearSearch = () => {
    onSearchChange("");
  };

  const handleSetShowHelpModal = () => {
    setShowHelpModal(!showHelpModal)
  }

  // Get search placeholder based on current route
  const getSearchPlaceholder = () => {
    switch (location.pathname) {
      case '/projects':
        return 'Search projects...';
      case '/statistics':
        return 'Search languages...';
      default:
        return 'Search technologies...';
    }
  }

  // Only show search results dropdown on radar page
  const shouldShowSearchResults = () => {
    return location.pathname === '/radar' && searchResults && searchResults.length > 0;
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
          <Link 
            to="/radar" 
            className={location.pathname === '/radar' ? 'active' : ''}
          >
            Tech Radar
          </Link>
          <Link 
            to="/statistics" 
            className={location.pathname === '/statistics' ? 'active' : ''}
          >
            Statistics
          </Link>
          <Link 
            to="/projects" 
            className={location.pathname === '/projects' ? 'active' : ''}
          >
            Projects
          </Link>
          {/* Keep this as an <a> tag since we want to force refresh for review */}
          <a 
            href="/review/dashboard"
            className={location.pathname === '/review/dashboard' ? 'active' : ''}
          >
            Review
          </a>
          <button onClick={() => handleSetShowHelpModal()}>
            Help
          </button>
        </nav>
      </div>
      <div className="header-right">
        {!hideSearch && (
          <div className="search-container">
            <IoSearch className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
            />
            {searchTerm ? (
              <button
                className="search-clear"
                onClick={clearSearch}
              >
                <IoClose />
              </button>
            ) : (
              <div className="search-shortcut">
                <span>{shortcutKey} + K</span>
              </div>
            )}
            {shouldShowSearchResults() && (
              <div className="search-results">
                {searchResults.map((result) => (
                  <div
                    key={result.id || result.Project || result.title}
                    className="search-result-item"
                    onClick={() => onSearchResultClick(result)}
                  >
                    <span className="search-result-title">{result.title}</span>
                    {result.timeline && (
                      <span
                        className={`search-result-ring ${result.timeline[result.timeline.length - 1].ringId.toLowerCase()}`}
                      >
                        {result.timeline[result.timeline.length - 1].ringId}
                      </span>
                    )}
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
