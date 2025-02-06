import React, { useState, useEffect } from "react";
import {
  IoArrowUpOutline,
  IoArrowDownOutline,
  IoRemoveOutline,
  IoGridOutline,
} from "react-icons/io5";
import { FaSortAmountDownAlt, FaSortAmountUpAlt, FaEdit, FaCheck, FaTimes } from "react-icons/fa";

const InfoBox = ({
  isAdmin = false,
  selectedItem,
  initialPosition = { x: 24, y: 80 },
  onClose,
  timelineAscending,
  setTimelineAscending,
  selectedTimelineItem,
  setSelectedTimelineItem,
  projectsForTech,
  handleProjectClick,
  onEditConfirm,
  onEditCancel,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCategory, setEditedCategory] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(initialPosition);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    e.stopPropagation(); // Prevent event from bubbling to parent
    setIsDragging(true);
    const infoBox = e.currentTarget.closest('.info-box');
    const infoBoxRect = infoBox.getBoundingClientRect();
    const clickX = e.clientX - infoBoxRect.left;
    const clickY = e.clientY - infoBoxRect.top;
    
    setDragOffset({
      x: clickX,
      y: clickY,
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

  const handleEditClick = () => {
    setEditedTitle(selectedItem.title);
    setEditedCategory(selectedItem.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTitle("");
    setEditedCategory("");
    if (onEditCancel) onEditCancel();
  };

  const handleConfirmEdit = () => {
    if (onEditConfirm) {
      onEditConfirm(editedTitle, editedCategory);
    }
    setIsEditing(false);
  };

  if (!selectedItem) {
    return (
      <div
        className="info-box"
        style={{
          position: "fixed",
          left: dragPosition.x,
          top: dragPosition.y,
          transform: "none",
          boxShadow: isDragging
            ? "0 4px 10px 0 hsl(var(--foreground) / 0.1)"
            : "none",
          minHeight: "100px",
          justifyContent: "center",
          resize: "none",
          cursor: "grab",
        }}
        onMouseDown={handleMouseDown}
      >
        <button className="info-box-close" onClick={onClose}>
          ×
        </button>
        <p className="info-box-placeholder">
          Hover over a blip to see details or click to lock the selection
        </p>
      </div>
    );
  }

  return (
    <div
      className="info-box"
      style={{
        position: "fixed",
        left: dragPosition.x,
        top: dragPosition.y,
        transform: "none",
        boxShadow: isDragging
          ? "0 4px 10px 0 hsl(var(--foreground) / 0.1)"
          : "none",
        resize: "both",
        overflow: "auto",
        maxWidth: "90vw",
        maxHeight: "450px",
      }}
    >
      <button className="info-box-close" onClick={onClose}>
        ×
      </button>
      <div className="info-box-header">
        <div className="info-box-drag-handle" onMouseDown={handleMouseDown}>
          <IoGridOutline size={12} />
        </div>
        {selectedItem.number && (
             <span className="info-box-number">#{selectedItem.number}</span>
        )}
       
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
              <button className="edit-confirm-button" onClick={handleConfirmEdit}>
                <FaCheck size={12} />
              </button>
              <button className="edit-cancel-button" onClick={handleCancelEdit}>
                <FaTimes size={12} />
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{selectedItem.title}</h3>
            {isAdmin && (
              <button className="edit-button" onClick={handleEditClick}>
                <FaEdit size={12} />
              </button>
            )}
          </>
        )}
      </div>
      <div className="info-box-header">
        <p className="info-box-ring">{selectedItem.description}</p>
        <span
          className={`info-box-ring ${selectedItem.timeline[
            selectedItem.timeline.length - 1
          ].ringId.toLowerCase()}`}
        >
          {selectedItem.timeline[selectedItem.timeline.length - 1].ringId}
        </span>
      </div>

      <div className="timeline-header">
        <div className="timeline-header-title">
          <h4>Timeline</h4>
          <button
            className="timeline-sort-button"
            onClick={() => setTimelineAscending(!timelineAscending)}
            title={timelineAscending ? "Newest first" : "Oldest first"}
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
        {[...selectedItem.timeline]
          .reverse()
          .slice()
          [timelineAscending ? "reverse" : "slice"]()
          .map((timelineItem, index, array) => (
            <div
              key={timelineItem.date + timelineItem.ringId + index}
              className="timeline-item"
            >
              <div
                className={`timeline-node ${timelineItem.ringId.toLowerCase()}`}
                onClick={() =>
                  setSelectedTimelineItem(
                    timelineItem === selectedTimelineItem ? null : timelineItem
                  )
                }
              >
                <span className="timeline-movement">
                  {timelineItem.moved > 0 && <IoArrowUpOutline size={10} />}
                  {timelineItem.moved === 0 && <IoRemoveOutline size={10} />}
                  {timelineItem.moved < 0 && <IoArrowDownOutline size={10} />}
                </span>
                {selectedTimelineItem === timelineItem
                  ? timelineItem.description
                  : new Date(timelineItem.date).toLocaleDateString("en-GB", {
                      month: "short",
                      year: "numeric",
                    })}
              </div>
              {index < array.length - 1 && <div className="timeline-connector" />}
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

      {selectedItem.links && selectedItem.links.length > 0 && (
        <ul className="info-box-links">
          {selectedItem.links.map((link, index) => (
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
    </div>
  );
};

export default InfoBox;
