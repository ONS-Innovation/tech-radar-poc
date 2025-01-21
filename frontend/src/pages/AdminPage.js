import React, { useState, useEffect } from 'react';
import { fetchTechRadarJSONFromS3 } from '../utilities/getTechRadarJson';
import Header from '../components/Header/Header';
import { ThemeProvider } from '../contexts/ThemeContext';
import '../styles/AdminPage.css';
import { toast } from 'react-hot-toast';
const AdminPage = () => {
  const [entries, setEntries] = useState({
    adopt: [],
    trial: [],
    assess: [],
    hold: [],
    review: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchTechRadarJSONFromS3();
        const categorizedEntries = categorizeEntries(data.entries);
        setEntries(categorizedEntries);
      } catch (error) {
        console.error('Error fetching radar data:', error);
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
      review: []
    };

    radarEntries.forEach(entry => {
      const currentRing = entry.timeline[entry.timeline.length - 1].ringId.toLowerCase();
      categorized[currentRing].push(entry);
    });

    return categorized;
  };

  const handleDragStart = (e, item, sourceList) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      item,
      sourceList
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    const dropZone = e.target.closest('.droppable-area');
    if (dropZone) {
      dropZone.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    const dropZone = e.target.closest('.droppable-area');
    if (dropZone) {
      dropZone.classList.remove('drag-over');
    }
  };

  const handleDrop = (e, destList) => {
    e.preventDefault();
    const dropZone = e.target.closest('.droppable-area');
    if (dropZone) {
      dropZone.classList.remove('drag-over');
    }

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { item, sourceList } = data;

      if (sourceList === destList) return;

      const updatedEntries = { ...entries };
      updatedEntries[sourceList] = updatedEntries[sourceList].filter(entry => entry.id !== item.id);
      
      // Update the item's timeline with the new ring
      const now = new Date().toISOString().split('T')[0];
      item.timeline.push({
        moved: 0,
        ringId: destList.toLowerCase(),
        date: now,
        description: `Admin Update ${now}`
      });
      
      updatedEntries[destList] = [...updatedEntries[destList], item];
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  };

  const handleSave = async () => {
    try {
      const baseUrl = process.env.NODE_ENV === "development" 
        ? 'http://localhost:5001/api/tech-radar/update'
        : '/api/tech-radar/update';

      // Combine all entries back into a single array
      const allEntries = [
        ...entries.adopt,
        ...entries.trial,
        ...entries.assess,
        ...entries.hold,
        ...entries.review
      ];

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries: allEntries }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      toast.success('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes. Please try again.');
    }
  };

  const renderBox = (title, items, id) => (
    <div className="admin-box">
      <h2>{title.charAt(0).toUpperCase() + title.slice(1)}</h2>
      <div
        className="droppable-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, id)}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="draggable-item"
            draggable
            onDragStart={(e) => handleDragStart(e, item, id)}
          >
            {item.title}
          </div>
        ))}
      </div>
    </div>
  );

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
      <div className="admin-container">
          <h1>Admin Dashboard</h1>
          <button className="save-button" onClick={handleSave}>
            Save Changes
          </button>
        </div>
        <div className="admin-grid">
          {renderBox('Adopt', entries.adopt, 'adopt')}
          {renderBox('Trial', entries.trial, 'trial')}
          {renderBox('Review', entries.review, 'review')}
          {renderBox('Assess', entries.assess, 'assess')}
          {renderBox('Hold', entries.hold, 'hold')}
        </div>

      </div>
    </ThemeProvider>
  );
};

export default AdminPage;
