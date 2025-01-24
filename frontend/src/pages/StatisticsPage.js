import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Statistics from '../components/Statistics/Statistics';
import Header from '../components/Header/Header';
import { ThemeProvider } from '../contexts/ThemeContext';
import { fetchTechRadarJSONFromS3 } from '../utilities/getTechRadarJson';

/**
 * StatisticsPage component for displaying the statistics page.
 * 
 * @returns {JSX.Element} - The StatisticsPage component.
 */
function StatisticsPage() {
  const navigate = useNavigate();
  const [statsData, setStatsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  /**
   * useEffect hook to handle the projects modal open state.
   */
  useEffect(() => {
    if (isProjectsModalOpen) {
      console.log('isProjectsModalOpen', isProjectsModalOpen);
    }
  }, [isProjectsModalOpen]);

  /**
   * fetchStatistics function to fetch the statistics data.
   * 
   * @param {string|null} date - The date to fetch the statistics for.
   * @param {string} repoView - The repository view to fetch the statistics for.
   */
  const fetchStatistics = async (date = null, repoView = 'unarchived') => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NODE_ENV === "development" 
        ? 'http://localhost:5001/api/json'
        : '/api/json';

      // Construct URL with parameters
      const params = new URLSearchParams();
      if (date && date !== 'all') params.append('datetime', date);
      if (repoView === 'archived') params.append('archived', 'true');
      else if (repoView === 'unarchived') params.append('archived', 'false');
      
      const url = params.toString() 
        ? `${baseUrl}?${params.toString()}`
        : baseUrl;

      const [statsResponse, radarResponse] = await Promise.all([
        fetch(url),
        fetchTechRadarJSONFromS3()
      ]);

      if (!statsResponse.ok || !radarResponse) {
        throw new Error('Failed to fetch data');
      }

      const [statsData, radarData] = await Promise.all([
        statsResponse.json(),
        radarResponse
      ]);

      if (!statsData.stats && !statsData.language_statistics) {
        throw new Error('Invalid response format');
      }

      const mappedStats = {
        stats_unarchived: repoView === 'unarchived' ? {
          total: statsData.stats?.total_repos || 0,
          private: statsData.stats?.total_private_repos || 0,
          public: statsData.stats?.total_public_repos || 0,
          internal: statsData.stats?.total_internal_repos || 0,
          active_last_month: 0,
          active_last_3months: 0,
          active_last_6months: 0
        } : {},
        stats_archived: repoView === 'archived' ? {
          total: statsData.stats?.total_repos || 0,
          private: statsData.stats?.total_private_repos || 0,
          public: statsData.stats?.total_public_repos || 0,
          internal: statsData.stats?.total_internal_repos || 0,
          active_last_month: 0,
          active_last_3months: 0,
          active_last_6months: 0
        } : {},
        stats: repoView === 'total' ? {
          total: statsData.stats?.total_repos || 0,
          private: statsData.stats?.total_private_repos || 0,
          public: statsData.stats?.total_public_repos || 0,
          internal: statsData.stats?.total_internal_repos || 0,
          active_last_month: 0,
          active_last_3months: 0,
          active_last_6months: 0
        } : null,
        language_statistics_unarchived: repoView === 'unarchived' ? statsData.language_statistics || {} : {},
        language_statistics_archived: repoView === 'archived' ? statsData.language_statistics || {} : {},
        language_statistics: repoView === 'total' ? statsData.language_statistics || {} : {},
        radar_entries: radarData.entries,
        metadata: statsData.metadata || { last_updated: new Date().toISOString() }
      };

      setStatsData(mappedStats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setStatsData({
        stats_unarchived: {
          total: 0,
          private: 0,
          public: 0,
          internal: 0,
          active_last_month: 0,
          active_last_3months: 0,
          active_last_6months: 0
        },
        stats_archived: {
          total: 0,
          private: 0,
          public: 0,
          internal: 0,
          active_last_month: 0,
          active_last_3months: 0,
          active_last_6months: 0
        },
        stats: null,
        language_statistics_unarchived: {},
        language_statistics_archived: {},
        language_statistics: {},
        radar_entries: [],
        metadata: { last_updated: new Date().toISOString() }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics(null, 'unarchived');
  }, []);

  const handleDateChange = (date, repoView = 'unarchived') => {
    const dateToUse = date === 'all' ? null : date;
    fetchStatistics(dateToUse, repoView);
  };

  const handleTechClick = (tech) => {
    navigate('/radar', { state: { selectedTech: tech } });
  };

  return (
    <ThemeProvider>
      <Header 
        searchTerm=""
        onSearchChange={() => {}}
        searchResults={[]}
        onSearchResultClick={() => {}}
        hideSearch={true}
        onOpenProjects={() => setIsProjectsModalOpen(true)}
      />
      <div className="statistics-page">
        <Statistics 
          data={statsData} 
          onTechClick={handleTechClick}
          onDateChange={handleDateChange}
          isLoading={isLoading}
        />
      </div>
    </ThemeProvider>
  );
}

export default StatisticsPage;