import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContext';
import Header from '../components/Header/Header';
import Statistics from '../components/Statistics/Statistics';
import { fetchRepositoryData } from '../utilities/getRepositoryData';
import { fetchCSVFromS3 } from '../utilities/getCSVData';
import { fetchTechRadarJSONFromS3 } from '../utilities/getTechRadarJson';
import toast from 'react-hot-toast';
import '../styles/StatisticsPage.css';

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
  const [projectsData, setProjectsData] = useState(null);
  const [selectedRepositories, setSelectedRepositories] = useState([]);
  const [currentDate, setCurrentDate] = useState(null);
  const [currentRepoView, setCurrentRepoView] = useState('unarchived');
  const [searchTerm, setSearchTerm] = useState('');
  const [radarData, setRadarData] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await fetchCSVFromS3();
        setProjectsData(data);
      } catch (error) {
        toast.error('Error fetching projects.')
      }
    };

    const fetchRadarData = async () => {
      try {
        const data = await fetchTechRadarJSONFromS3();
        setRadarData(data);
      } catch (error) {
        console.error('Failed to load radar data:', error);
      }
    };

    fetchProjects();
    fetchRadarData();
  }, []);

  /**
   * fetchStatistics function to fetch the statistics data.
   * 
   * @param {string|null} date - The date to fetch the statistics for.
   * @param {string} repoView - The repository view to fetch the statistics for.
   */
  const fetchStatistics = async (date = null, repoView = 'unarchived') => {
    setIsLoading(true);
    try {
      let data;
      if (selectedRepositories.length > 0) {
        // Extract repository names from the URLs
        const repoNames = selectedRepositories.map(repoUrl => {
          const match = repoUrl.match(/github\.com\/[^/]+\/([^/]+)/);
          return match ? match[1] : null;
        }).filter(Boolean);

        // Fetch repository-specific data with all active filters
        const archived = repoView === 'archived' ? 'true' : 
                        repoView === 'unarchived' ? 'false' : null;
        const repoData = await fetchRepositoryData(repoNames, date, archived);
        
        if (!repoData?.repositories) {
          throw new Error('Failed to fetch repository data');
        }

        data = {
          stats_unarchived: repoView === 'unarchived' ? {
            total: repoData.stats?.total_repos || 0,
            private: repoData.stats?.total_private_repos || 0,
            public: repoData.stats?.total_public_repos || 0,
            internal: repoData.stats?.total_internal_repos || 0
          } : {},
          stats_archived: repoView === 'archived' ? {
            total: repoData.stats?.total_repos || 0,
            private: repoData.stats?.total_private_repos || 0,
            public: repoData.stats?.total_public_repos || 0,
            internal: repoData.stats?.total_internal_repos || 0
          } : {},
          stats: repoView === 'total' ? {
            total: repoData.stats?.total_repos || 0,
            private: repoData.stats?.total_private_repos || 0,
            public: repoData.stats?.total_public_repos || 0,
            internal: repoData.stats?.total_internal_repos || 0
          } : null,
          language_statistics_unarchived: repoView === 'unarchived' ? repoData.language_statistics || {} : {},
          language_statistics_archived: repoView === 'archived' ? repoData.language_statistics || {} : {},
          language_statistics: repoView === 'total' ? repoData.language_statistics || {} : {},
          radar_entries: radarData?.entries || [],
          metadata: repoData.metadata || { last_updated: new Date().toISOString() }
        };
      } else {
        // Fetch general statistics
        const baseUrl = process.env.NODE_ENV === "development" 
          ? 'http://localhost:5001/api/json'
          : '/api/json';

        const params = new URLSearchParams();
        if (date) params.append('datetime', date);
        if (repoView === 'archived') params.append('archived', 'true');
        else if (repoView === 'unarchived') params.append('archived', 'false');
        
        const url = params.toString() 
          ? `${baseUrl}?${params.toString()}`
          : baseUrl;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const statsData = await response.json();
        data = {
          stats_unarchived: repoView === 'unarchived' ? {
            total: statsData.stats?.total_repos || 0,
            private: statsData.stats?.total_private_repos || 0,
            public: statsData.stats?.total_public_repos || 0,
            internal: statsData.stats?.total_internal_repos || 0
          } : {},
          stats_archived: repoView === 'archived' ? {
            total: statsData.stats?.total_repos || 0,
            private: statsData.stats?.total_private_repos || 0,
            public: statsData.stats?.total_public_repos || 0,
            internal: statsData.stats?.total_internal_repos || 0
          } : {},
          stats: repoView === 'total' ? {
            total: statsData.stats?.total_repos || 0,
            private: statsData.stats?.total_private_repos || 0,
            public: statsData.stats?.total_public_repos || 0,
            internal: statsData.stats?.total_internal_repos || 0
          } : null,
          language_statistics_unarchived: repoView === 'unarchived' ? statsData.language_statistics || {} : {},
          language_statistics_archived: repoView === 'archived' ? statsData.language_statistics || {} : {},
          language_statistics: repoView === 'total' ? statsData.language_statistics || {} : {},
          radar_entries: radarData?.entries || [],
          metadata: statsData.metadata || { last_updated: new Date().toISOString() }
        };
      }
      setStatsData(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load statistics.');
      setStatsData({
        stats_unarchived: {},
        stats_archived: {},
        stats: null,
        language_statistics_unarchived: {},
        language_statistics_archived: {},
        language_statistics: {},
        radar_entries: radarData?.entries || [],
        metadata: { last_updated: new Date().toISOString() }
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to use current filters and refetch when radar data changes
  useEffect(() => {
    if (radarData) {
      fetchStatistics(currentDate, currentRepoView);
    }
  }, [selectedRepositories, currentDate, currentRepoView, radarData]);

  const handleDateChange = (date, repoView = 'unarchived') => {
    setCurrentDate(date === 'all' ? null : date);
    setCurrentRepoView(repoView);
  };

  const handleTechClick = (tech) => {
    navigate('/radar', { state: { selectedTech: tech } });
  };

  const handleProjectsChange = (repositories) => {
    // Flatten the array of repository URLs by splitting each URL by semicolon
    const allRepoUrls = repositories.flatMap(repoUrl => 
      repoUrl.split(';').map(url => {
        const cleanUrl = url.trim().split('#')[0]; // Remove #readme and any other hash parts
        return cleanUrl;
      })
    );
    setSelectedRepositories(allRepoUrls);
  };

  const getFilteredLanguages = () => {
    if (!statsData) return [];
    
    const languageStats = statsData.language_statistics_unarchived || {};
    const languages = Object.entries(languageStats)
      .filter(([language]) => {
        return language.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .map(([language, stats]) => ({
        language,
        ...stats
      }));

    return languages;
  };

  const filteredLanguages = getFilteredLanguages();

  return (
    <ThemeProvider>
      <Header 
        searchTerm={searchTerm}
        onSearchChange={(value) => setSearchTerm(value)}
        searchResults={[]}
        onSearchResultClick={(result) => handleTechClick(result.language)}
      />
      <div className="statistics-page">
        <Statistics 
          data={statsData} 
          onTechClick={handleTechClick}
          onDateChange={handleDateChange}
          isLoading={isLoading}
          projectsData={projectsData}
          onProjectsChange={handleProjectsChange}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>
    </ThemeProvider>
  );
}

export default StatisticsPage;