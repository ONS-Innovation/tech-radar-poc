import React, { useEffect, useState } from "react";
import "./styles/App.css";
import Header from "./components/Header/Header";
import { ThemeProvider } from "./contexts/ThemeContext";
import {
  IoInformationCircle,
  IoGridOutline,
  IoChevronUpOutline,
  IoChevronDownOutline,
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoRemoveOutline,
} from "react-icons/io5";
import { Toaster, toast } from "react-hot-toast";
import { FaSortAmountDownAlt, FaSortAmountUpAlt } from "react-icons/fa";
import { fetchCSVFromS3 } from "./utilities/getCSVData";

function App() {
  const [data, setData] = useState(null);
  const [selectedBlip, setSelectedBlip] = useState(null);
  const [lockedBlip, setLockedBlip] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isInfoBoxVisible, setIsInfoBoxVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 277, y: 80 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [expandedQuadrants, setExpandedQuadrants] = useState({
    1: true,
    2: true,
    3: true,
    4: true,
  });
  const [projectsData, setProjectsData] = useState(null);
  const [projectsForTech, setProjectsForTech] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [draggingQuadrant, setDraggingQuadrant] = useState(null);
  const [quadrantPositions, setQuadrantPositions] = useState({
    4: null, // top-left
    1: null, // top-right
    3: null, // bottom-left
    2: null, // bottom-right
  });
  const [quadrantDragOffset, setQuadrantDragOffset] = useState({ x: 0, y: 0 });
  const [allBlips, setAllBlips] = useState([]);
  const [selectedTimelineItem, setSelectedTimelineItem] = useState(null);
  const [timelineAscending, setTimelineAscending] = useState(false);

  useEffect(() => {
    fetch("/tech_radar/onsRadarSkeleton.json")
      .then((response) => response.json())
      .then((data) => setData(data));
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchCSVFromS3();
        setProjectsData(data);
      } catch (error) {
        try {
          const response = await fetch("/tech_radar/onsTechData.csv");
          if (!response.ok) {
            throw new Error("Failed to fetch local CSV");
          }
          const csvText = await response.text();
          const rows = csvText.split("\n");
          const headers = rows[0].split(",");
          const data = rows.slice(1).map(row => {
            const values = row.split(",");
            return headers.reduce((obj, header, i) => {
              obj[header] = values[i];
              return obj;
            }, {});
          });
          toast.error("Error loading data from S3, using local CSV.");
          setProjectsData(data);
        } catch (fallbackError) {
          toast.error("Failed to load project data");
        }
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!data) return;

    const blipsArray = Object.values(data.quadrants)
      .flatMap((quadrant) => {
        const quadrantId = quadrant.id;
        return numberedEntries[quadrantId] || [];
      })
      .sort((a, b) => a.number - b.number);

    setAllBlips(blipsArray);
  }, [data]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lockedBlip || !allBlips.length) return;

      const currentIndex = allBlips.findIndex(
        (blip) => blip.id === lockedBlip.id
      );
      if (currentIndex === -1) return;

      let nextBlip;

      if ((e.key === "1")) {
        if (currentIndex > 0) {
          nextBlip = allBlips[currentIndex - 1];
        }
      } else if ((e.key === "2")) {
        if (currentIndex < allBlips.length - 1) {
          nextBlip = allBlips[currentIndex + 1];
        }
      }

      if (nextBlip) {
        const projects = findProjectsUsingTechnology(nextBlip.title);
        setProjectsForTech(projects);
        setLockedBlip(nextBlip);
        setSelectedBlip(nextBlip);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lockedBlip, allBlips]);

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

    const radiusIndex = Math.floor(index / angleSteps + 0.75);
    const angleIndex = index % angleSteps;

    const radiusStep = ringWidth / (radiusSteps + 1.5);
    const radius = innerRadius + (radiusIndex + 1) * radiusStep;

    const angleStep = Math.PI / 2.4 / angleSteps;
    const adjustedBaseAngle = (baseAngle - 117.5) * (Math.PI / 180);
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

    const results = data.entries
      .filter(
        (entry) =>
          entry.title.toLowerCase().includes(term.toLowerCase()) ||
          entry.description.toLowerCase().includes(term.toLowerCase())
      )
      .map((entry) => ({
        ...entry,
        timeline: [...entry.timeline].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        ),
      }));

    setSearchResults(results);
  };

  const handleSearchResultClick = (entry) => {
    const quadrant = entry.quadrant;
    const entryWithNumber = numberedEntries[quadrant].find(
      (e) => e.id === entry.id
    );

    const projects = findProjectsUsingTechnology(entry.title);

    setProjectsForTech(projects);
    setLockedBlip(entryWithNumber);
    setSelectedBlip(entryWithNumber);
    setIsInfoBoxVisible(true);

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

      if (draggingQuadrant) {
        setQuadrantPositions((prev) => ({
          ...prev,
          [draggingQuadrant]: {
            x: e.clientX - quadrantDragOffset.x,
            y: e.clientY - quadrantDragOffset.y,
          },
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDraggingQuadrant(null);
    };

    if (isDragging || draggingQuadrant) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, draggingQuadrant, quadrantDragOffset]);

  const toggleQuadrant = (quadrantId) => {
    setExpandedQuadrants((prev) => ({
      ...prev,
      [quadrantId]: !prev[quadrantId],
    }));
  };

  const findProjectsUsingTechnology = (tech) => {
    if (!projectsData) return [];

    return projectsData.filter((project) => {
      const allTechColumns = [
        "Language_Main",
        "Language_Others",
        "Language_Frameworks",
        "Languages_Adopt",
        "Languages_Trial",
        "Languages_Assess",
        "Languages_Hold",
        "Frameworks_Adopt",
        "Frameworks_Trial",
        "Frameworks_Assess",
        "Frameworks_Hold",
        "Infrastructure_Adopt",
        "Infrastructure_Trial",
        "Infrastructure_Assess",
        "Infrastructure_Hold",
        "CICD_Adopt",
        "CICD_Trial",
        "CICD_Assess",
        "CICD_Hold",
      ];

      return allTechColumns.some((column) => {
        const value = project[column];
        if (!value) return false;

        return value
          .split(";")
          .some((item) => item.trim().toLowerCase() === tech.toLowerCase());
      });
    });
  };

  const handleBlipClick = (entry, fromModal = false) => {
    const projects = findProjectsUsingTechnology(entry.title);
    setProjectsForTech(projects);
    setIsInfoBoxVisible(true);

    const quadrant = entry.quadrant;
    const entryWithNumber = numberedEntries[quadrant].find(
      (e) => e.id === entry.id
    );

    if (fromModal) {
      setLockedBlip(entryWithNumber);
      setSelectedBlip(entryWithNumber);
    } else if (lockedBlip?.id === entry.id) {
      setLockedBlip(null);
      setSelectedBlip(null);
    } else {
      setLockedBlip(entryWithNumber);
      setSelectedBlip(entryWithNumber);
    }
  };

  const handleBlipHover = (entry) => {
    setSelectedBlip(entry);
    if (entry !== null) {
      const projects = findProjectsUsingTechnology(entry.title);
      setProjectsForTech(projects);
      setIsInfoBoxVisible(true);
    }
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  const handleFileUpload = (convertedData) => {
    setProjectsData((prevData) => {
      const existingData = prevData || [];
      return [...existingData, ...convertedData];
    });
  };

  const checkForDuplicates = (newData) => {
    const existingProjects = new Set(
      projectsData?.map((project) => project.Project) || []
    );

    const newProjects = [];
    const duplicates = [];

    newData.forEach((project) => {
      if (existingProjects.has(project.Project)) {
        duplicates.push(project);
      } else {
        newProjects.push(project);
        existingProjects.add(project.Project);
      }
    });

    return { newProjects, duplicates };
  };

  if (!data) return <div className="loading-container">Loading...</div>;

  const groupedEntries = data.entries.reduce((acc, entry) => {
    const quadrant = entry.quadrant;
    const sortedTimeline = [...entry.timeline].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const currentRing = sortedTimeline[0].ringId;

    if (!acc[quadrant]) acc[quadrant] = {};
    if (!acc[quadrant][currentRing]) acc[quadrant][currentRing] = [];

    acc[quadrant][currentRing].push({
      ...entry,
      timeline: sortedTimeline,
    });
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

  const isTechnologyInRadar = (techName) => {
    return data.entries.some(
      (entry) => entry.title.toLowerCase() === techName.toLowerCase().trim()
    );
  };

  const handleTechClick = (tech) => {
    const radarEntry = data.entries.find(
      (entry) => entry.title.toLowerCase() === tech.toLowerCase().trim()
    );

    if (radarEntry) {
      const quadrant = radarEntry.quadrant;
      const entryWithNumber = numberedEntries[quadrant].find(
        (entry) => entry.id === radarEntry.id
      );

      setIsProjectModalOpen(false);
      handleBlipClick(entryWithNumber, true);
    }
  };

  const getTechnologyStatus = (tech) => {
    const entry = data.entries.find(
      (entry) => entry.title.toLowerCase() === tech.trim().toLowerCase()
    );
    return entry ? entry.timeline[0].ringId.toLowerCase() : null;
  };

  const renderTechnologyList = (technologies) => {
    if (!technologies) return null;

    return technologies.split(";").map((tech, index) => {
      const trimmedTech = tech.trim();
      const isInRadar = isTechnologyInRadar(trimmedTech);
      const status = isInRadar ? getTechnologyStatus(trimmedTech) : null;

      return (
        <span key={index}>
          {index > 0 && "; "}
          {isInRadar ? (
            <span
              className={`clickable-tech ${status}`}
              onClick={() => handleTechClick(trimmedTech)}
            >
              {trimmedTech}
            </span>
          ) : (
            trimmedTech
          )}
        </span>
      );
    });
  };

  const handleQuadrantMouseDown = (e, quadrantId) => {
    e.stopPropagation();
    if (e.target.closest(".drag-handle")) {
      const rect = e.currentTarget.getBoundingClientRect();
      setQuadrantDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setDraggingQuadrant(quadrantId);
    }
  };

  return (
    <ThemeProvider>
      <Header
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        searchResults={searchResults}
        onSearchResultClick={handleSearchResultClick}
        onFileUpload={handleFileUpload}
        checkForDuplicates={checkForDuplicates}
      />
      <div className="radar-page">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "hsl(var(--card))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            },
            success: {
              iconTheme: {
                primary: "var(--color-adopt)",
                secondary: "white",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--color-hold)",
                secondary: "white",
              },
            },
          }}
        />

        {isInfoBoxVisible && (
          <div
            className="info-box"
            style={{
              position: "fixed",
              left: dragPosition.x,
              top: dragPosition.y,
              transform: "none",
              cursor: isDragging ? "grabbing" : "grab",
              boxShadow: isDragging
                ? "0 4px 10px 0 hsl(var(--foreground) / 0.1)"
                : "none",
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
                  <p className="info-box-ring">
                    {(selectedBlip || lockedBlip).description}
                  </p>
                  <span
                    className={`info-box-ring ${(
                      selectedBlip || lockedBlip
                    ).timeline[0].ringId.toLowerCase()}`}
                  >
                    {(selectedBlip || lockedBlip).timeline[0].ringId}
                  </span>
                </div>

                <div className="timeline-header">
                  <div className="timeline-header-title">
                    <h4>Timeline</h4>
                    <button
                      className="timeline-sort-button"
                      onClick={() => setTimelineAscending(!timelineAscending)}
                      title={
                        timelineAscending ? "Newest first" : "Oldest first"
                      }
                    >
                      {timelineAscending ? (
                        <FaSortAmountDownAlt size={12} />
                      ) : (
                        <FaSortAmountUpAlt size={12} />
                      )}
                    </button>
                  </div>
                  <p>Click a box to show the description of the event</p>
                </div>

                <div className="timeline-container">
                  {[...(selectedBlip || lockedBlip).timeline]
                    .sort((a, b) => {
                      const comparison = new Date(b.date) - new Date(a.date);
                      return timelineAscending ? -comparison : comparison;
                    })
                    .map((timelineItem, index, array) => (
                      <div key={timelineItem.date} className="timeline-item">
                        <div
                          className={`timeline-node ${timelineItem.ringId.toLowerCase()}`}
                          onClick={() =>
                            setSelectedTimelineItem(
                              timelineItem === selectedTimelineItem
                                ? null
                                : timelineItem
                            )
                          }
                        >
                          <span className="timeline-movement">
                            {timelineItem.moved > 0 && (
                              <IoArrowUpOutline size={10} />
                            )}
                            {timelineItem.moved === 0 && (
                              <IoRemoveOutline size={10} />
                            )}
                            {timelineItem.moved < 0 && (
                              <IoArrowDownOutline size={10} />
                            )}
                          </span>
                          {selectedTimelineItem === timelineItem
                            ? timelineItem.description
                            : new Date(timelineItem.date).toLocaleDateString(
                                "en-GB",
                                {
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                        </div>
                        {index < array.length - 1 && (
                          <div className="timeline-connector" />
                        )}
                      </div>
                    ))}
                </div>

                {projectsForTech.length > 0 && (
                  <div className="info-box-projects">
                    <h4>
                      <strong>
                        {projectsForTech.length}{" "}
                        {projectsForTech.length === 1 ? "project" : "projects"}
                      </strong>{" "}
                      using this technology:
                    </h4>
                    <p>Click a project to view more details</p>
                    <ul>
                      {projectsForTech.map((project, index) => (
                        <li
                          key={index}
                          onClick={() => handleProjectClick(project)}
                          className="info-box-project-item clickable-tech"
                        >
                          {project.Project || project.Project_Short}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

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
            style={{
              ...(quadrantPositions["4"]
                ? {
                    position: "fixed",
                    left: quadrantPositions["4"].x,
                    top: quadrantPositions["4"].y,
                    margin: 0,
                    zIndex: draggingQuadrant === "4" ? 1000 : 100,
                  }
                : {}),
              cursor: draggingQuadrant === "4" ? "grabbing" : "auto",
              boxShadow:
                draggingQuadrant === "4"
                  ? "0 4px 10px 0 hsl(var(--foreground) / 0.1)"
                  : "none",
            }}
            onMouseDown={(e) => handleQuadrantMouseDown(e, "4")}
          >
            <div className="quadrant-header">
              <span className="drag-handle">
                <IoGridOutline size={12} />
              </span>
              <div
                className="quadrant-header-content"
                onClick={() => toggleQuadrant("4")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <h2>{data.quadrants.find((q) => q.id === "4").name}</h2>
                  <span className="info-icon">
                    <IoInformationCircle size={18} />
                    <span className="tooltip">
                      Click to view more details
                    </span>
                  </span>
                </div>
                <span
                  className={`accordion-arrow ${
                    expandedQuadrants["4"] ? "expanded" : ""
                  }`}
                >
                  {expandedQuadrants["4"] ? (
                    <IoChevronUpOutline size={16} />
                  ) : (
                    <IoChevronDownOutline size={16} />
                  )}
                </span>
              </div>
            </div>
            {expandedQuadrants["4"] && (
              <ul>
                {numberedEntries["4"]?.map((entry) => (
                  <li
                    key={entry.id}
                    onClick={() => handleBlipClick(entry)}
                    style={{ cursor: "pointer" }}
                  >
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
            style={{
              ...(quadrantPositions["1"]
                ? {
                    position: "fixed",
                    left: quadrantPositions["1"].x,
                    top: quadrantPositions["1"].y,
                    margin: 0,
                    zIndex: draggingQuadrant === "1" ? 1000 : 100,
                  }
                : {}),
              cursor: draggingQuadrant === "1" ? "grabbing" : "auto",
              boxShadow:
                draggingQuadrant === "1"
                  ? "0 4px 10px 0 hsl(var(--foreground) / 0.1)"
                  : "none",
            }}
            onMouseDown={(e) => handleQuadrantMouseDown(e, "1")}
          >
            <div className="quadrant-header">
              <span className="drag-handle">
                <IoGridOutline size={12} />
              </span>
              <div
                className="quadrant-header-content"
                onClick={() => toggleQuadrant("1")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <h2>{data.quadrants.find((q) => q.id === "1").name}</h2>
                  <span className="info-icon">
                    <IoInformationCircle size={18} />
                    <span className="tooltip">
                      Click to view more details
                    </span>
                  </span>
                </div>
                <span
                  className={`accordion-arrow ${
                    expandedQuadrants["1"] ? "expanded" : ""
                  }`}
                >
                  {expandedQuadrants["1"] ? (
                    <IoChevronUpOutline size={16} />
                  ) : (
                    <IoChevronDownOutline size={16} />
                  )}
                </span>
              </div>
            </div>
            <ul>
              {numberedEntries["1"]?.map((entry) => (
                <li
                  key={entry.id}
                  onClick={() => handleBlipClick(entry)}
                  style={{ cursor: "pointer" }}
                >
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

              <line
                x1="-500"
                y1="0"
                x2="500"
                y2="0"
                className="quadrant-line"
              />
              <line
                x1="0"
                y1="-500"
                x2="0"
                y2="500"
                className="quadrant-line"
              />

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
                          !lockedBlip &&
                          handleBlipHover(
                            numberedEntries[quadrant].find(
                              (e) => e.id === entry.id
                            )
                          )
                        }
                        onMouseLeave={() =>
                          !lockedBlip && handleBlipHover(null)
                        }
                        onClick={() => {
                          handleBlipClick(entry);
                        }}
                      >
                        <circle
                          r="15"
                          className={`blip ${ring.toLowerCase()}`}
                        />
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
            style={{
              ...(quadrantPositions["3"]
                ? {
                    position: "fixed",
                    left: quadrantPositions["3"].x,
                    top: quadrantPositions["3"].y,
                    margin: 0,
                    zIndex: draggingQuadrant === "3" ? 1000 : 100,
                  }
                : {}),
              cursor: draggingQuadrant === "3" ? "grabbing" : "auto",
              boxShadow:
                draggingQuadrant === "3"
                  ? "0 4px 10px 0 hsl(var(--foreground) / 0.1)"
                  : "none",
            }}
            onMouseDown={(e) => handleQuadrantMouseDown(e, "3")}
          >
            <div className="quadrant-header">
              <span className="drag-handle">
                <IoGridOutline size={12} />
              </span>
              <div
                className="quadrant-header-content"
                onClick={() => toggleQuadrant("3")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <h2>{data.quadrants.find((q) => q.id === "3").name}</h2>
                  <span className="info-icon">
                    <IoInformationCircle size={18} />
                    <span className="tooltip">
                      Click to view more details
                    </span>
                  </span>
                </div>
                <span
                  className={`accordion-arrow ${
                    expandedQuadrants["3"] ? "expanded" : ""
                  }`}
                >
                  {expandedQuadrants["3"] ? (
                    <IoChevronUpOutline size={16} />
                  ) : (
                    <IoChevronDownOutline size={16} />
                  )}
                </span>
              </div>
            </div>
            <ul>
              {numberedEntries["3"]?.map((entry) => (
                <li
                  key={entry.id}
                  onClick={() => handleBlipClick(entry)}
                  style={{ cursor: "pointer" }}
                >
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
            style={{
              ...(quadrantPositions["2"]
                ? {
                    position: "fixed",
                    left: quadrantPositions["2"].x,
                    top: quadrantPositions["2"].y,
                    margin: 0,
                    zIndex: draggingQuadrant === "2" ? 1000 : 100,
                  }
                : {}),
              cursor: draggingQuadrant === "2" ? "grabbing" : "auto",
              boxShadow:
                draggingQuadrant === "2"
                  ? "0 4px 10px 0 hsl(var(--foreground) / 0.1)"
                  : "none",
            }}
            onMouseDown={(e) => handleQuadrantMouseDown(e, "2")}
          >
            <div className="quadrant-header">
              <span className="drag-handle">
                <IoGridOutline size={12} />
              </span>
              <div
                className="quadrant-header-content"
                onClick={() => toggleQuadrant("2")}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <h2>{data.quadrants.find((q) => q.id === "2").name}</h2>
                  <span className="info-icon">
                    <IoInformationCircle size={18} />
                    <span className="tooltip">
                      Click to view more details
                    </span>
                  </span>
                </div>
                <span
                  className={`accordion-arrow ${
                    expandedQuadrants["2"] ? "expanded" : ""
                  }`}
                >
                  {expandedQuadrants["2"] ? (
                    <IoChevronUpOutline size={16} />
                  ) : (
                    <IoChevronDownOutline size={16} />
                  )}
                </span>
              </div>
            </div>
            <ul>
              {numberedEntries["2"]?.map((entry) => (
                <li
                  key={entry.id}
                  onClick={() => handleBlipClick(entry)}
                  style={{ cursor: "pointer" }}
                >
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

        {isProjectModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsProjectModalOpen(false)}
          >
            <div
              className="modal-content project-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setIsProjectModalOpen(false)}
              >
                ×
              </button>

              {/* Project Title Section */}
              <div className="project-title-section">
                <h2>{selectedProject.Project}</h2>
                {selectedProject.Project_Short && (
                  <div className="project-short-name">
                    ({selectedProject.Project_Short})
                  </div>
                )}
              </div>

              <div className="project-details">
                {/* Core Details */}
                {selectedProject.Project_Area && (
                  <div className="detail-item">
                    <h3>Project Area:</h3>
                    <p>{selectedProject.Project_Area}</p>
                  </div>
                )}

                {selectedProject.Team && (
                  <div className="detail-item">
                    <h3>Team:</h3>
                    <p>{selectedProject.Team}</p>
                  </div>
                )}

                {selectedProject.DST_Area && (
                  <div className="detail-item">
                    <h3>DST Area:</h3>
                    <p>{selectedProject.DST_Area}</p>
                  </div>
                )}

                {/* Languages & Frameworks */}
                {selectedProject.Language_Main && (
                  <div className="detail-item">
                    <h3>Main Language:</h3>
                    <p>{renderTechnologyList(selectedProject.Language_Main)}</p>
                  </div>
                )}

                {selectedProject.Language_Others && (
                  <div className="detail-item">
                    <h3>Other Languages:</h3>
                    <p>
                      {renderTechnologyList(selectedProject.Language_Others)}
                    </p>
                  </div>
                )}

                {selectedProject.Language_Frameworks && (
                  <div className="detail-item">
                    <h3>Frameworks:</h3>
                    <p>
                      {renderTechnologyList(
                        selectedProject.Language_Frameworks
                      )}
                    </p>
                  </div>
                )}

                {/* Testing */}
                {selectedProject.Testing_Frameworks && (
                  <div className="detail-item">
                    <h3>Testing Frameworks:</h3>
                    <p>
                      {renderTechnologyList(selectedProject.Testing_Frameworks)}
                    </p>
                  </div>
                )}

                {/* Infrastructure */}
                {selectedProject.Hosted && (
                  <div className="detail-item">
                    <h3>Hosted On:</h3>
                    <p>{selectedProject.Hosted}</p>
                  </div>
                )}

                {selectedProject.Containers && (
                  <div className="detail-item">
                    <h3>Containers:</h3>
                    <p>{renderTechnologyList(selectedProject.Containers)}</p>
                  </div>
                )}

                {selectedProject.Architectures && (
                  <div className="detail-item">
                    <h3>Architecture:</h3>
                    <p>{selectedProject.Architectures}</p>
                  </div>
                )}

                {/* Source Control */}
                {selectedProject.Source_Control && (
                  <div className="detail-item">
                    <h3>Source Control:</h3>
                    <p>{selectedProject.Source_Control}</p>
                  </div>
                )}

                {selectedProject.Branching_Strategy && (
                  <div className="detail-item">
                    <h3>Branching Strategy:</h3>
                    <p>{selectedProject.Branching_Strategy}</p>
                  </div>
                )}

                {/* Development Tools */}
                {selectedProject.Static_Analysis && (
                  <div className="detail-item">
                    <h3>Static Analysis:</h3>
                    <p>
                      {renderTechnologyList(selectedProject.Static_Analysis)}
                    </p>
                  </div>
                )}

                {selectedProject.Code_Formatter && (
                  <div className="detail-item">
                    <h3>Code Formatter:</h3>
                    <p>
                      {renderTechnologyList(selectedProject.Code_Formatter)}
                    </p>
                  </div>
                )}

                {/* Data & Monitoring */}
                {selectedProject.Monitoring && (
                  <div className="detail-item">
                    <h3>Monitoring:</h3>
                    <p>{renderTechnologyList(selectedProject.Monitoring)}</p>
                  </div>
                )}

                {selectedProject.Datastores && (
                  <div className="detail-item">
                    <h3>Datastores:</h3>
                    <p>{renderTechnologyList(selectedProject.Datastores)}</p>
                  </div>
                )}

                {selectedProject.Data_Output_Formats && (
                  <div className="detail-item">
                    <h3>Data Output Formats:</h3>
                    <p>
                      {renderTechnologyList(
                        selectedProject.Data_Output_Formats
                      )}
                    </p>
                  </div>
                )}

                {/* Integrations */}
                {selectedProject.Integrations_ONS && (
                  <div className="detail-item">
                    <h3>ONS Integrations:</h3>
                    <p>
                      {renderTechnologyList(selectedProject.Integrations_ONS)}
                    </p>
                  </div>
                )}

                {selectedProject.Integrations_External && (
                  <div className="detail-item">
                    <h3>External Integrations:</h3>
                    <p>
                      {renderTechnologyList(
                        selectedProject.Integrations_External
                      )}
                    </p>
                  </div>
                )}

                {/* Documentation */}
                {selectedProject.Documentation && (
                  <div className="detail-item">
                    <h3>Documentation:</h3>
                    <a
                      href={selectedProject.Documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Documentation
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
