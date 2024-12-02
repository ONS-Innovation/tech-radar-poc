import React, { useEffect, useState } from "react";
import "./styles/App.css";
import Header from './components/Header/Header';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [data, setData] = useState(null);
  const [selectedBlip, setSelectedBlip] = useState(null);
  const [lockedBlip, setLockedBlip] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSearchResult, setSelectedSearchResult] = useState(null);
  const [isInfoBoxVisible, setIsInfoBoxVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 50, y: 80 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [expandedQuadrants, setExpandedQuadrants] = useState({
    1: true,
    2: true,
    3: true,
    4: true,
  });

  useEffect(() => {
    fetch("/tech_radar/onsRadarSkeleton.json")
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []);

  const quadrantAngles = {
    1: 45,
    2: 135,
    3: 225,
    4: 315,
  };

  const ringRadii = {
    adopt: [0, 150],
    trial: [150, 250],
    assess: [250, 325],
    hold: [325, 400],
  };

  const calculateBlipPosition = (quadrant, ring, index, total) => {
    const baseAngle = quadrantAngles[quadrant];
    const [innerRadius, outerRadius] = ringRadii[ring.toLowerCase()];

    const ringWidth = outerRadius - innerRadius;

    const radiusSteps = Math.ceil(Math.sqrt(total));
    const angleSteps = Math.ceil(total / radiusSteps);
  
    const radiusIndex = Math.floor(index / angleSteps + 0.5);
    const angleIndex = index % angleSteps;

    const radiusStep = ringWidth / (radiusSteps + 1);
    const radius = innerRadius + (radiusIndex + 1) * radiusStep;

    const angleStep = Math.PI / 2.4 / angleSteps;
    const adjustedBaseAngle = (baseAngle - 37.5) * (Math.PI / 180);
    const angle = adjustedBaseAngle + angleIndex * angleStep;

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const getColorForRing = (ring) => {
    const colors = {
      adopt: "#008a00",
      trial: "#cb00b4",
      assess: "#0069e5",
      hold: "#de001a",
    };
    return colors[ring];
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    const results = data.entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(term.toLowerCase()) ||
        entry.description.toLowerCase().includes(term.toLowerCase())
    );
    setSearchResults(results);
  };

  const handleSearchResultClick = (entry) => {
    setSelectedSearchResult(entry);
    setIsModalOpen(true);
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setDragPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const toggleQuadrant = (quadrantId) => {
    setExpandedQuadrants((prev) => ({
      ...prev,
      [quadrantId]: !prev[quadrantId],
    }));
  };

  if (!data) return <div>Loading...</div>;

  const groupedEntries = data.entries.reduce((acc, entry) => {
    const quadrant = entry.quadrant;
    const ring = entry.timeline[0].ringId;

    if (!acc[quadrant]) acc[quadrant] = {};
    if (!acc[quadrant][ring]) acc[quadrant][ring] = [];

    acc[quadrant][ring].push(entry);
    return acc;
  }, {});

  const numberedEntries = {};
  let counter = 1;
  Object.keys(groupedEntries).forEach((quadrant) => {
    numberedEntries[quadrant] = [];
    Object.keys(ringRadii).forEach((ring) => {
      if (groupedEntries[quadrant][ring]) {
        groupedEntries[quadrant][ring].forEach((entry) => {
          numberedEntries[quadrant].push({
            ...entry,
            number: counter++,
          });
        });
      }
    });
  });

  return (
    <ThemeProvider>
      <div className="radar-page">
        <Header 
          searchTerm={searchTerm}
          onSearchChange={handleSearch}
          searchResults={searchResults}
          onSearchResultClick={handleSearchResultClick}
        />

        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
              <h2>{selectedSearchResult.title}</h2>
              
              <div className="modal-info">
                <div className="modal-info-tags">
                <p className="modal-ring">{selectedSearchResult.description}</p>
                <span
                  className={`modal-ring ${selectedSearchResult.timeline[0].ringId.toLowerCase()}`}
                >
                  {selectedSearchResult.timeline[0].ringId}
                </span>
                </div>
                {selectedSearchResult.links &&
                  selectedSearchResult.links.length > 0 && (
                    <div className="modal-links">
                      <h3>Links:</h3>
                      <ul>
                        {selectedSearchResult.links.map((link, index) => (
                          <li key={index}>
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {link}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {isInfoBoxVisible && (
          <div
            className="info-box"
            style={{
              position: "fixed",
              left: dragPosition.x,
              top: dragPosition.y,
              transform: "none",
              cursor: isDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleMouseDown}
          >
            <button
              className="info-box-close"
              onClick={() => setIsInfoBoxVisible(false)}
            >
              ×
            </button>
            {selectedBlip || lockedBlip ? (
              <>
                <div className="info-box-header">
                  <span className="info-box-number">
                    #{(selectedBlip || lockedBlip).number}
                  </span>
                  <h3>{(selectedBlip || lockedBlip).title}</h3>
                </div>
                <div className="info-box-header">
                  <p className="info-box-ring">{(selectedBlip || lockedBlip).description}</p>
                  <span
                    className={`info-box-ring ${(
                      selectedBlip || lockedBlip
                    ).timeline[0].ringId.toLowerCase()}`}
                  >
                    {(selectedBlip || lockedBlip).timeline[0].ringId}
                  </span>
                </div>

                {(selectedBlip || lockedBlip).links &&
                  (selectedBlip || lockedBlip).links.length > 0 && (
                    <ul className="info-box-links">
                      {(selectedBlip || lockedBlip).links.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {link}
                        </a>
                      ))}
                    </ul>
                  )}
              </>
            ) : (
              <p className="info-box-placeholder">
                Hover over a blip to see details
              </p>
            )}
          </div>
        )}

        <div className="quadrant-lists">
          <div
            className={`quadrant-list top-left ${
              expandedQuadrants["4"] ? "expanded" : "collapsed"
            }`}
          >
            <div className="quadrant-header" onClick={() => toggleQuadrant("4")}>
              <h2>{data.quadrants.find((q) => q.id === "4").name}</h2>
              <span
                className={`accordion-arrow ${
                  expandedQuadrants["4"] ? "expanded" : ""
                }`}
              >
                ▼
              </span>
            </div>
            {expandedQuadrants["4"] && (
              <ul>
                {numberedEntries["4"]?.map((entry) => (
                  <li key={entry.id}>
                    <span className="entry-number">{entry.number}.</span>
                    <span className="entry-title">{entry.title}</span>
                    <span
                      className={`entry-ring ${entry.timeline[0].ringId.toLowerCase()}`}
                    >
                      {entry.timeline[0].ringId}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={`quadrant-list top-right ${
              expandedQuadrants["1"] ? "expanded" : "collapsed"
            }`}
          >
            <div className="quadrant-header" onClick={() => toggleQuadrant("1")}>
              <h2>{data.quadrants.find((q) => q.id === "1").name}</h2>
              <span
                className={`accordion-arrow ${
                  expandedQuadrants["1"] ? "expanded" : ""
                }`}
              >
                ▼
              </span>
            </div>
            <ul>
              {numberedEntries["1"]?.map((entry) => (
                <li key={entry.id}>
                  <span className="entry-number">{entry.number}.</span>
                  <span className="entry-title">{entry.title}</span>
                  <span
                    className={`entry-ring ${entry.timeline[0].ringId.toLowerCase()}`}
                  >
                    {entry.timeline[0].ringId}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="radar-container">
            <svg width="1000" height="1000" viewBox="-500 -500 1000 1000">
              {/* Rings */}
              {Object.entries(ringRadii).map(([ring, [_, radius]]) => (
                <circle
                  key={ring}
                  cx="0"
                  cy="0"
                  r={radius}
                  className={`ring ${ring}`}
                />
              ))}

              <line x1="-500" y1="0" x2="500" y2="0" className="quadrant-line" />
              <line x1="0" y1="-500" x2="0" y2="500" className="quadrant-line" />

              <text x="0" y="-350" className="ring-label">
                HOLD
              </text>
              <text x="0" y="-275" className="ring-label">
                ASSESS
              </text>
              <text x="0" y="-185" className="ring-label">
                TRIAL
              </text>
              <text x="0" y="0" className="ring-label">
                ADOPT
              </text>

              <text x="250" y="-400" className="quadrant-label">
                Languages
              </text>
              <text x="250" y="400" className="quadrant-label">
                Frameworks
              </text>
              <text x="-250" y="400" className="quadrant-label">
                CI/CD
              </text>
              <text x="-250" y="-400" className="quadrant-label">
                Infrastructure
              </text>

              {Object.entries(groupedEntries).map(([quadrant, rings]) =>
                Object.entries(rings).map(([ring, entries]) =>
                  entries.map((entry, index) => {
                    const position = calculateBlipPosition(
                      quadrant,
                      ring,
                      index,
                      entries.length
                    );
                    const number = numberedEntries[quadrant].find(
                      (e) => e.id === entry.id
                    ).number;
                    const isSelected = lockedBlip?.id === entry.id;

                    return (
                      <g
                        key={entry.id}
                        transform={`translate(${position.x}, ${position.y})`}
                        className="blip-container"
                        onMouseEnter={() =>
                          !lockedBlip && setSelectedBlip({ ...entry, number })
                        }
                        onMouseLeave={() => !lockedBlip && setSelectedBlip(null)}
                        onClick={() => {
                          setIsInfoBoxVisible(true);
                          if (lockedBlip?.id === entry.id) {
                            setLockedBlip(null);
                            setSelectedBlip(null);
                          } else {
                            setLockedBlip({ ...entry, number });
                            setSelectedBlip({ ...entry, number });
                          }
                        }}
                      >
                        <circle r="15" className={`blip ${ring.toLowerCase()}`} />
                        {isSelected && (
                          <circle
                            r="18"
                            className="blip-highlight"
                            stroke={getColorForRing(ring.toLowerCase())}
                            strokeWidth="2"
                            fill="none"
                          />
                        )}
                        <text
                          className="blip-number"
                          textAnchor="middle"
                          dy=".3em"
                        >
                          {number}
                        </text>
                      </g>
                    );
                  })
                )
              )}
            </svg>
          </div>

          <div
            className={`quadrant-list bottom-left ${
              expandedQuadrants["3"] ? "expanded" : "collapsed"
            }`}
          >
            <div className="quadrant-header" onClick={() => toggleQuadrant("3")}>
              <h2>{data.quadrants.find((q) => q.id === "3").name}</h2>
              <span
                className={`accordion-arrow ${
                  expandedQuadrants["3"] ? "expanded" : ""
                }`}
              >
                ▼
              </span>
            </div>
            <ul>
              {numberedEntries["3"]?.map((entry) => (
                <li key={entry.id}>
                  <span className="entry-number">{entry.number}.</span>
                  <span className="entry-title">{entry.title}</span>
                  <span
                    className={`entry-ring ${entry.timeline[0].ringId.toLowerCase()}`}
                  >
                    {entry.timeline[0].ringId}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className={`quadrant-list bottom-right ${
              expandedQuadrants["2"] ? "expanded" : "collapsed"
            }`}
          >
            <div className="quadrant-header" onClick={() => toggleQuadrant("2")}>
              <h2>{data.quadrants.find((q) => q.id === "2").name}</h2>
              <span
                className={`accordion-arrow ${
                  expandedQuadrants["2"] ? "expanded" : ""
                }`}
              >
                ▼
              </span>
            </div>
            <ul>
              {numberedEntries["2"]?.map((entry) => (
                <li key={entry.id}>
                  <span className="entry-number">{entry.number}.</span>
                  <span className="entry-title">{entry.title}</span>
                  <span
                    className={`entry-ring ${entry.timeline[0].ringId.toLowerCase()}`}
                  >
                    {entry.timeline[0].ringId}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
