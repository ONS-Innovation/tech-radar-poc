import React, { useState, useEffect } from "react";
import { fetchTechRadarJSONFromS3 } from "../utilities/getTechRadarJson";
import Header from "../components/Header/Header";
import { ThemeProvider } from "../contexts/ThemeContext";
import "../styles/AdminPage.css";
import { toast } from "react-hot-toast";
import { FaSortAmountDownAlt, FaSortAmountUpAlt } from "react-icons/fa";
import SkeletonStatCard from "../components/Statistics/Skeletons/SkeletonStatCard";

const AdminPage = () => {
  const [entries, setEntries] = useState({
    adopt: [],
    trial: [],
    assess: [],
    hold: [],
    review: [],
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const [timelineAscending, setTimelineAscending] = useState(false);
  const [expandedTimelineEntry, setExpandedTimelineEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTechRadarJSONFromS3();
        const categorizedEntries = categorizeEntries(data.entries);
        setEntries(categorizedEntries);
      } catch (error) {
        console.error("Error fetching radar data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const categorizeEntries = (radarEntries) => {
    const categorized = {
      adopt: [],
      trial: [],
      assess: [],
      hold: [],
      review: [],
    };

    radarEntries.forEach((entry) => {
      const currentRing =
        entry.timeline[entry.timeline.length - 1].ringId.toLowerCase();
      categorized[currentRing].push(entry);
    });

    return categorized;
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

      // Update the item's timeline with the new ring
      const now = new Date().toISOString().split("T")[0];
      item.timeline.push({
        moved: 0,
        ringId: destList.toLowerCase(),
        date: now,
        description: `Admin Update ${now}`,
      });

      updatedEntries[destList] = [...updatedEntries[destList], item];
      setEntries(updatedEntries);
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  };

  const handleSave = async () => {
    try {
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:5001/api/tech-radar/update"
          : "/api/tech-radar/update";

      // Combine all entries back into a single array
      const allEntries = [
        ...entries.adopt,
        ...entries.trial,
        ...entries.assess,
        ...entries.hold,
        ...entries.review,
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
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const handleTimelineEntryClick = (index) => {
    setExpandedTimelineEntry(expandedTimelineEntry === index ? null : index);
  };

  const renderTimeline = () => {
    if (!selectedItem) {
      return (
        <div className="timeline-display">
          <div className="timeline-empty">
            Click on an item to view its timeline
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
          <h3>{selectedItem.title}</h3>
          <p>{selectedItem.description}</p>
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

    // Group items by description
    const groupedItems = items.reduce((acc, item) => {
      const description = item.description || "Other";
      if (!acc[description]) {
        acc[description] = [];
      }
      acc[description].push(item);
      return acc;
    }, {});

    return (
      <div className="admin-box">
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
        <div className="admin-grid">
          {renderBox("Adopt", entries.adopt, "adopt")}
          {renderBox("Trial", entries.trial, "trial")}
          {renderBox("Review", entries.review, "review")}
          {renderBox("Assess", entries.assess, "assess")}
          {renderBox("Hold", entries.hold, "hold")}
          <div className="admin-box">
            {isLoading ? (
              <div className="timeline-display">
                <SkeletonStatCard />
              </div>
            ) : (
              renderTimeline()
            )}
            <div className="admin-container">
              <button className="save-button" onClick={handleSave} disabled={isLoading}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default AdminPage;
