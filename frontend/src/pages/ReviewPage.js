import React, { useState, useEffect } from "react";
import { fetchTechRadarJSONFromS3 } from "../utilities/getTechRadarJson";
import { fetchCSVFromS3 } from "../utilities/getCSVData";
import Header from "../components/Header/Header";
import { ThemeProvider } from "../contexts/ThemeContext";
import "../styles/ReviewPage.css";
import { toast } from "react-hot-toast";
import {
  FaSortAmountDownAlt,
  FaSortAmountUpAlt,
  FaEdit,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import SkeletonStatCard from "../components/Statistics/Skeletons/SkeletonStatCard";
import MultiSelect from "../components/MultiSelect/MultiSelect";

const ReviewPage = () => {
  const [entries, setEntries] = useState({
    adopt: [],
    trial: [],
    assess: [],
    hold: [],
    review: [],
    ignore: [],
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [timelineAscending, setTimelineAscending] = useState(false);
  const [expandedTimelineEntry, setExpandedTimelineEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newTechnology, setNewTechnology] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editedItem, setEditedItem] = useState(null);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [projectData, setProjectData] = useState([]);
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false);
  const [pendingNewTechnology, setPendingNewTechnology] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showAddTechnologyModal, setShowAddTechnologyModal] = useState(false);

  // Fields to scan from CSV and their corresponding categories
  const fieldsToScan = {
    Language_Main: "Languages",
    Language_Others: "Languages",
    Language_Frameworks: "Frameworks",
    Testing_Frameworks: "Supporting Tools",
    CICD: "Supporting Tools",
    CICD_Orchestration: "Infrastructure",
    Monitoring: "Infrastructure",
    Infrastructure: "Infrastructure",
  };

  const categoryOptions = [
    { label: "Languages", value: "Languages" },
    { label: "Frameworks", value: "Frameworks" },
    { label: "Supporting Tools", value: "Supporting Tools" },
    { label: "Infrastructure", value: "Infrastructure" },
  ];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const [radarData, csvData] = await Promise.all([
          fetchTechRadarJSONFromS3(),
          fetchCSVFromS3(),
        ]);

        const categorizedEntries = categorizeEntries(radarData.entries);
        setEntries(categorizedEntries);
        setProjectData(csvData);

        // After loading both data sources, scan for new technologies
        scanForNewTechnologies(radarData.entries, csvData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const categorizeEntries = (radarEntries) => {
    const categorized = {
      adopt: [],
      trial: [],
      assess: [],
      hold: [],
      review: [],
      ignore: [],
    };

    radarEntries.forEach((entry) => {
      const currentRing =
        entry.timeline[entry.timeline.length - 1].ringId.toLowerCase();
      categorized[currentRing].push(entry);
    });

    return categorized;
  };

  const scanForNewTechnologies = (radarEntries, csvData) => {
    // Create a set of existing technology titles (case insensitive)
    const existingTech = new Set(
      radarEntries.map((entry) => entry.title.toLowerCase())
    );

    const newTechnologies = new Map();

    // Process CSV data
    csvData.forEach((project) => {
      Object.entries(fieldsToScan).forEach(([field, category]) => {
        if (project[field]) {
          // Split by semicolon if multiple values exist
          const technologies = project[field].split(";");

          technologies.forEach((tech) => {
            const trimmedTech = tech.trim();
            if (trimmedTech && !existingTech.has(trimmedTech.toLowerCase())) {
              // Use Map to prevent duplicates and maintain category
              newTechnologies.set(trimmedTech, category);
            }
          });
        }
      });
    });

    // Add new technologies to review
    if (newTechnologies.size > 0) {
      const categoryToQuadrant = {
        Languages: "1",
        Frameworks: "2",
        "Supporting Tools": "3",
        Infrastructure: "4",
      };

      const newEntries = Array.from(newTechnologies).map(
        ([tech, category]) => ({
          id: `tech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: tech,
          description: category,
          key: tech.toLowerCase().replace(/\s+/g, "-"),
          url: "#",
          quadrant: categoryToQuadrant[category],
          timeline: [
            {
              moved: 0,
              ringId: "review",
              date: new Date().toISOString().split("T")[0],
              description: "Added from project data scan",
            },
          ],
          links: [],
        })
      );

      setEntries((prev) => ({
        ...prev,
        review: [...prev.review, ...newEntries],
      }));

      toast.success(
        `Added ${newTechnologies.size} new technologies from project data`
      );
    }
  };

  // Add this function to calculate ring movement
  const calculateRingMovement = (sourceRing, destRing) => {
    const ringOrder = ["hold", "assess", "trial", "adopt"];
    const sourceIndex = ringOrder.indexOf(sourceRing.toLowerCase());
    const destIndex = ringOrder.indexOf(destRing.toLowerCase());

    // If either ring is 'review', 'ignore' or rings are the same, no movement
    if (
      sourceRing === "review" ||
      destRing === "review" ||
      sourceRing === "ignore" ||
      destRing === "ignore" ||
      sourceRing === destRing
    ) {
      return 0;
    }

    // Calculate movement based on index difference
    return destIndex - sourceIndex;
  };

  const handleDragStart = (e, item, sourceList) => {
    e.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        item,
        sourceList,
      })
    );
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const dropZone = e.target.closest(".droppable-area");
    if (dropZone) {
      dropZone.classList.add("drag-over");
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    const dropZone = e.target.closest(".droppable-area");
    if (dropZone) {
      dropZone.classList.remove("drag-over");
    }
  };

  const handleDrop = (e, destList) => {
    e.preventDefault();
    const dropZone = e.target.closest(".droppable-area");
    if (dropZone) {
      dropZone.classList.remove("drag-over");
    }

    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      const { item, sourceList } = data;

      if (sourceList === destList) return;

      const updatedEntries = { ...entries };
      updatedEntries[sourceList] = updatedEntries[sourceList].filter(
        (entry) => entry.id !== item.id
      );

      // Calculate movement value
      const lastRing =
        item.timeline[item.timeline.length - 1].ringId.toLowerCase();
      const movement = calculateRingMovement(lastRing, destList);

      // Update the item's timeline with the new ring
      const now = new Date().toISOString().split("T")[0];
      const updatedItem = {
        ...item,
        timeline: [
          ...item.timeline,
          {
            moved: movement,
            ringId: destList.toLowerCase(),
            date: now,
            description: `Moved from ${lastRing} to ${destList}`,
          },
        ],
      };

      updatedEntries[destList] = [...updatedEntries[destList], updatedItem];
      setEntries(updatedEntries);

      // Update the timeline if the dropped item is currently selected
      if (selectedItem && selectedItem.id === item.id) {
        setSelectedItem(updatedItem);
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  const handleSaveClick = () => {
    setShowSaveConfirmModal(true);
  };

  const handleSaveConfirmModalYes = async () => {
    try {
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:5001/review/api/tech-radar/update"
          : "/review/api/tech-radar/update";

      // Combine all entries back into a single array
      const allEntries = [
        ...entries.adopt,
        ...entries.trial,
        ...entries.assess,
        ...entries.hold,
        ...entries.review,
        ...entries.ignore,
      ];

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entries: allEntries }),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      toast.success("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setShowSaveConfirmModal(false);
    }
  };

  const handleSaveConfirmModalNo = () => {
    setShowSaveConfirmModal(false);
  };

  const handleItemClick = (item) => {
    // If we're editing and clicking a different item, cancel the edit
    if (isEditing && selectedItem && selectedItem.id !== item.id) {
      setIsEditing(false);
      setEditedTitle("");
      setEditedCategory("");
    }

    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const handleTimelineEntryClick = (index) => {
    setExpandedTimelineEntry(expandedTimelineEntry === index ? null : index);
  };

  const handleAddClick = () => {
    if (!newTechnology.trim()) {
      toast.error("Please enter a technology name");
      return;
    }

    if (!selectedCategory) {
      toast.error("Please select a category");
      return;
    }

    // Map category to quadrant number
    const categoryToQuadrant = {
      Languages: "1",
      Frameworks: "2",
      "Supporting Tools": "3",
      Infrastructure: "4",
    };

    const newEntry = {
      id: `tech-${Date.now()}`,
      title: newTechnology.trim(),
      description: selectedCategory,
      key: newTechnology.trim().toLowerCase().replace(/\s+/g, ""),
      url: "#",
      quadrant: categoryToQuadrant[selectedCategory],
      timeline: [
        {
          moved: 0,
          ringId: "review",
          date: new Date().toISOString().split("T")[0],
          description: "Added for review",
        },
      ],
      links: [],
    };

    setPendingNewTechnology(newEntry);
    setShowAddConfirmModal(true);
    setShowAddTechnologyModal(false);
  };

  const handleEditClick = () => {
    setEditedTitle(selectedItem.title);
    setEditedCategory(selectedItem.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle("");
    setEditedCategory("");
  };

  const handleConfirmEdit = () => {
    setShowConfirmModal(true);
    setEditedItem({
      ...selectedItem,
      title: editedTitle,
      description: editedCategory,
      id: `${editedTitle.toLowerCase().replace(/\s+/g, "")}-${Date.now()}`,
      key: `${editedTitle.toLowerCase().replace(/\s+/g, "")}-${Date.now()}`,
      quadrant: categoryToQuadrant[editedCategory],
    });
  };

  const categoryToQuadrant = {
    Languages: "1",
    Frameworks: "2",
    "Supporting Tools": "3",
    Infrastructure: "4",
  };

  const handleConfirmModalYes = () => {
    const currentRing =
      selectedItem.timeline[selectedItem.timeline.length - 1].ringId;

    // Create timeline entry for the change
    const now = new Date().toISOString().split("T")[0];
    const timelineEntry = {
      moved: 0,
      ringId: currentRing,
      date: now,
      description: `Changed from ${selectedItem.title} (${selectedItem.description}) to ${editedTitle} (${editedCategory})`,
    };

    // Update the item with new values and timeline
    const updatedItem = {
      ...editedItem,
      timeline: [...selectedItem.timeline, timelineEntry],
    };

    // Update entries state
    const updatedEntries = { ...entries };
    updatedEntries[currentRing] = updatedEntries[currentRing].map((item) =>
      item.id === selectedItem.id ? updatedItem : item
    );

    setEntries(updatedEntries);
    setSelectedItem(updatedItem);
    setIsEditing(false);
    setShowConfirmModal(false);
    setEditedTitle("");
    setEditedCategory("");
    toast.success("Technology updated successfully");
  };

  const handleConfirmModalNo = () => {
    setShowConfirmModal(false);
  };

  const handleAddConfirmModalYes = () => {
    setEntries((prev) => ({
      ...prev,
      review: [...prev.review, pendingNewTechnology],
    }));
    setNewTechnology("");
    setSelectedCategory("");
    setPendingNewTechnology(null);
    setShowAddConfirmModal(false);
    toast.success("Technology added to Review");
  };

  const handleAddConfirmModalNo = () => {
    setPendingNewTechnology(null);
    setShowAddConfirmModal(false);
  };

  const renderTimeline = () => {
    if (!selectedItem) {
      return (
        <div className="timeline-display">
          <div className="timeline-empty">
            Click on an item to view its timeline and edit the details
          </div>
        </div>
      );
    }

    const timelineEntries = timelineAscending
      ? [...selectedItem.timeline]
      : [...selectedItem.timeline].reverse();

    return (
      <div className="timeline-display">
        <div className="timeline-display-header">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="edit-title-input"
              />
              <select
                value={editedCategory}
                onChange={(e) => setEditedCategory(e.target.value)}
                className="edit-category-select"
              >
                <option value="Languages">Languages</option>
                <option value="Frameworks">Frameworks</option>
                <option value="Supporting Tools">Supporting Tools</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
              <div className="edit-buttons">
                <button
                  className="edit-confirm-button"
                  onClick={handleConfirmEdit}
                >
                  <FaCheck size={12} />
                </button>
                <button
                  className="edit-cancel-button"
                  onClick={handleCancelEdit}
                >
                  <FaTimes size={12} />
                </button>
              </div>
            </>
          ) : (
            <>
              <h3>{selectedItem.title}</h3>
              <p>{selectedItem.description}</p>
              <button className="edit-button" onClick={handleEditClick}>
                <FaEdit size={12} />
              </button>
            </>
          )}
          <button
            className="timeline-sort-button"
            onClick={() => setTimelineAscending(!timelineAscending)}
            title={timelineAscending ? "Original order" : "Reverse order"}
          >
            {timelineAscending ? (
              <FaSortAmountDownAlt size={12} />
            ) : (
              <FaSortAmountUpAlt size={12} />
            )}
          </button>
        </div>
        <div className="timeline-info">
          Click a box to show more info about the event
        </div>
        <div className="timeline-entries">
          {timelineEntries.map((entry, index, array) => (
            <React.Fragment key={index}>
              <div
                className={`timeline-entry ${entry.ringId.toLowerCase()} ${expandedTimelineEntry === index ? "expanded" : ""}`}
                onClick={() => handleTimelineEntryClick(index)}
              >
                <span>
                  {new Date(entry.date)
                    .toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })
                    .replace(
                      /(\d+)/,
                      "$1" +
                        (new Date(entry.date).getDate() === 1
                          ? "st"
                          : new Date(entry.date).getDate() === 2
                            ? "nd"
                            : new Date(entry.date).getDate() === 3
                              ? "rd"
                              : "th")
                    )}
                </span>
                {expandedTimelineEntry === index && (
                  <span className="timeline-ring">{entry.ringId}</span>
                )}
                {expandedTimelineEntry === index && (
                  <span>{entry.description}</span>
                )}
              </div>
              {index < array.length - 1 && (
                <div className="timeline-connector" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderBox = (title, items, id) => {
    if (isLoading) {
      return (
        <div className="admin-box">
          <h2>{title.charAt(0).toUpperCase() + title.slice(1)}</h2>
          <div className="droppable-area">
            {[1, 2, 3].map((i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
        </div>
      );
    }

    // Filter items based on search term and selected categories
    const filteredItems = items.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategories =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) => cat.value === item.description);
      return matchesSearch && matchesCategories;
    });

    // Group filtered items by description
    const groupedItems = filteredItems.reduce((acc, item) => {
      const description = item.description || "Other";
      if (!acc[description]) {
        acc[description] = [];
      }
      acc[description].push(item);
      return acc;
    }, {});

    return (
      <div className={`admin-box ${title.toLowerCase()}-box`}>
        <h2>{title.charAt(0).toUpperCase() + title.slice(1)}</h2>
        <div
          className="droppable-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, id)}
        >
          {Object.entries(groupedItems).map(([description, groupItems]) => (
            <div key={description} className="droppable-group">
              <div className="droppable-group-header">{description}</div>
              <div className="droppable-group-items">
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    className="draggable-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item, id)}
                    onClick={() => handleItemClick(item)}
                    style={{
                      backgroundColor:
                        selectedItem?.id === item.id
                          ? "hsl(var(--accent))"
                          : undefined,
                    }}
                  >
                    {item.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ThemeProvider>
      <Header
        searchTerm=""
        onSearchChange={() => {}}
        searchResults={[]}
        onSearchResultClick={() => {}}
        hideSearch={true}
      />
      <div className="admin-page">
        <div className="admin-details">
          <div className="admin-header-left">
            <div className="admin-review-title">
              <h1>Reviewer Dashboard</h1>
              <span>
                {/* Update and add to the Tech Radar. Please{" "}
                <strong>take caution</strong> when changing details about
                technologies. <strong>You cannot undo changes.</strong> */}
              </span>
            </div>
            <div className="admin-filter-search-flex">
              <div className="admin-filter-section-container">
                <div className="admin-filter-section">
                  <h4>Search for technology</h4>
                  <input
                    type="text"
                    className="admin-search-box"
                    placeholder="Python, Java etc."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="admin-filter-section">
                  <h4>Filter by Category</h4>
                  <MultiSelect
                    options={categoryOptions}
                    value={selectedCategories}
                    onChange={setSelectedCategories}
                    placeholder="Select categories..."
                  />
                </div>
              </div>
              <div className="admin-actions">
                <div>
                  <h4> Reviewer Actions</h4>
                </div>
                <div className="buttons">
                  <button
                    className="admin-button"
                    onClick={() => setShowAddTechnologyModal(true)}
                    disabled={isLoading}
                  >
                    Add Technology
                  </button>
                  <button
                    className="admin-button"
                    onClick={handleSaveClick}
                    disabled={isLoading}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="admin-search-filter">
            {isLoading ? (
              <div className="timeline-display">
                <SkeletonStatCard />
              </div>
            ) : (
              renderTimeline()
            )}
          </div>
        </div>

        <div className="admin-grid-container">
          <div className="admin-grid">
            {renderBox("Adopt", entries.adopt, "adopt")}
            {renderBox("Trial", entries.trial, "trial")}
            {renderBox("Assess", entries.assess, "assess")}
            {renderBox("Hold", entries.hold, "hold")}
          </div>
          <div className="admin-divider">  </div>
          <div className="admin-grid">
            {renderBox("Review", entries.review, "review")}
            {renderBox("Ignore", entries.ignore, "ignore")}
          </div>
        </div>
      </div>
      {showAddTechnologyModal && (
        <div className="modal-overlay">
          <div className="admin-modal">
            <h3>Add New Technology</h3>
            <div className="admin-modal-inputs">
              <div className="admin-modal-field">
                <label>Technology Name</label>
                <input
                  type="text"
                  value={newTechnology}
                  onChange={(e) => setNewTechnology(e.target.value)}
                  placeholder="Enter new technology"
                  className="technology-input"
                />
              </div>
              <div className="admin-modal-field">
                <label>Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="">Select Category</option>
                  <option value="Languages">Languages</option>
                  <option value="Frameworks">Frameworks</option>
                  <option value="Supporting Tools">Supporting Tools</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>
            </div>
            <div className="modal-buttons">
              <button
                onClick={handleAddClick}
                disabled={!newTechnology.trim() || !selectedCategory}
              >
                Add
              </button>
              <button onClick={() => setShowAddTechnologyModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="admin-modal">
            <h3>Confirm Changes</h3>
            <p>Are you sure you want to update this technology?</p>
            <p className="destructive">
              From: {selectedItem.title} ({selectedItem.description})
            </p>
            <p className="constructive">
              To: {editedTitle} ({editedCategory})
            </p>
            <div className="modal-buttons">
              <button onClick={handleConfirmModalYes}>Yes</button>
              <button onClick={handleConfirmModalNo}>No</button>
            </div>
          </div>
        </div>
      )}
      {showSaveConfirmModal && (
        <div className="modal-overlay">
          <div className="admin-modal">
            <h3>WARNING</h3>
            <p>Are you sure you want to save all changes to the Tech Radar?</p>
            <p>This action cannot be undone.</p>
            <div className="modal-buttons">
              <button onClick={handleSaveConfirmModalYes}>Yes</button>
              <button onClick={handleSaveConfirmModalNo}>No</button>
            </div>
          </div>
        </div>
      )}
      {showAddConfirmModal && pendingNewTechnology && (
        <div className="modal-overlay">
          <div className="admin-modal tech-confirm-modal">
            <h3>Add New Technology</h3>
            <p>Are you sure you want to add this technology?</p>
            <p>Name: {pendingNewTechnology.title}</p>
            <p className="modal-automatic">
              Ring: Review <i>automatic</i>
            </p>
            <p>Quadrant: {pendingNewTechnology.description}</p>
            <div className="modal-buttons">
              <button onClick={handleAddConfirmModalYes}>Yes</button>
              <button onClick={handleAddConfirmModalNo}>No</button>
            </div>
          </div>
        </div>
      )}
    </ThemeProvider>
  );
};

export default ReviewPage;
