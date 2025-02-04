import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MenuDropdown from "../MenuDropdown/MenuDropdown";
import HelpModal from "./HelpModal";
import "../../styles/components/Header.css";
import Logo from "../../assets/logo.png";
import { IoClose, IoSearch } from "react-icons/io5";
import { FaQuestion } from "react-icons/fa";

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
  searchTerm,
  onSearchChange,
  searchResults,
  onSearchResultClick,
  onOpenProjects,
  onStatsTechClick,
  hideSearch = false,
}) {
  const navigate = useNavigate();
  const [showHelpModal, setShowHelpModal] = useState(false);

  /**
   * Clears the search term.
   */
  const clearSearch = () => {
    onSearchChange("");
  };

  return (
    <header className="radar-header">
      <div className="header-left">
        <img
          src={Logo}
          alt="Logo"
          className="logo"
          onClick={() => navigate("/radar")}
          style={{ cursor: "pointer" }}
        />
        <h1 onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          Digital Landscape
        </h1>
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
            {searchResults.length > 0 && (
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
                      {result.timeline[0].ringId}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <MenuDropdown
          onOpenProjects={onOpenProjects}
          onStatsTechClick={onStatsTechClick}
        />
        <button
          className="help-button"
          onClick={() => setShowHelpModal(true)}
          title="Help"
        >
          <FaQuestion size={14} />
        </button>
        <HelpModal
          show={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
      </div>
    </header>
  );
}

export default Header;
