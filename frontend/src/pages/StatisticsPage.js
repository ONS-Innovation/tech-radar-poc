import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Statistics from "../components/Statistics/Statistics";
import Header from "../components/Header/Header";
import { ThemeProvider } from "../contexts/ThemeContext";
import { toast } from "react-hot-toast";
import '../styles/StatisticsPage.css';
import { useData } from "../contexts/dataContext";

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
  const { getTechRadarData, getRepositoryData, getRepositoryStats, getCsvData } = useData();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [techData, projectData] = await Promise.all([
          getTechRadarData(),
          getCsvData()
        ]);
        setRadarData(techData);
        setProjectsData(projectData);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    fetchData();
  }, [getTechRadarData, getCsvData]);

  /**
   * fetchStatistics function to fetch the statistics data.
   *
   * @param {string|null} date - The date to fetch the statistics for.
   * @param {string} repoView - The repository view to fetch the statistics for.
   */
  const fetchStatistics = async (date = null, repoView = "unarchived") => {
    setIsLoading(true);
    try {
      let statsResponse;
      const radarResponse = await getTechRadarData();

      if (selectedRepositories.length > 0) {
        const repoNames = selectedRepositories
          .map((repoUrl) => {
            const match = repoUrl.match(/github\.com\/[^/]+\/([^/]+)/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        const archived = repoView === "archived" 
          ? "true" 
          : repoView === "unarchived" 
            ? "false" 
            : null;

        const repoResponse = await getRepositoryData(repoNames, date, archived);

        if (!repoResponse?.repositories) {
          throw new Error("Failed to fetch repository data");
        }

        statsResponse = {
          stats: repoResponse.stats,
          language_statistics: repoResponse.language_statistics,
          metadata: repoResponse.metadata,
        };
      } else {
        // Use context for general statistics
        statsResponse = await getRepositoryStats(
          date, 
          repoView === "archived" ? "true" : 
          repoView === "unarchived" ? "false" : null
        );
      }

      if (!statsResponse || !radarResponse) {
        throw new Error("Failed to fetch data");
      }

      const mappedStats = {
        stats_unarchived:
          repoView === "unarchived"
            ? {
                total: statsResponse.stats?.total_repos || 0,
                private: statsResponse.stats?.total_private_repos || 0,
                public: statsResponse.stats?.total_public_repos || 0,
                internal: statsResponse.stats?.total_internal_repos || 0,
                active_last_month: 0,
                active_last_3months: 0,
                active_last_6months: 0,
              }
            : {},
        stats_archived:
          repoView === "archived"
            ? {
                total: statsResponse.stats?.total_repos || 0,
                private: statsResponse.stats?.total_private_repos || 0,
                public: statsResponse.stats?.total_public_repos || 0,
                internal: statsResponse.stats?.total_internal_repos || 0,
                active_last_month: 0,
                active_last_3months: 0,
                active_last_6months: 0,
              }
            : {},
        stats:
          repoView === "total"
            ? {
                total: statsResponse.stats?.total_repos || 0,
                private: statsResponse.stats?.total_private_repos || 0,
                public: statsResponse.stats?.total_public_repos || 0,
                internal: statsResponse.stats?.total_internal_repos || 0,
                active_last_month: 0,
                active_last_3months: 0,
                active_last_6months: 0,
              }
            : null,
        language_statistics_unarchived:
          repoView === "unarchived" ? statsResponse.language_statistics || {} : {},
        language_statistics_archived:
          repoView === "archived" ? statsResponse.language_statistics || {} : {},
        language_statistics:
          repoView === "total" ? statsResponse.language_statistics || {} : {},
        radar_entries: radarResponse.entries,
        metadata: statsResponse.metadata || {
          last_updated: new Date().toISOString(),
        },
      };

      setStatsData(mappedStats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load statistics.');
      setStatsData({
        stats_unarchived: {
          total: 0,
          private: 0,
          public: 0,
          internal: 0,
          active_last_month: 0,
          active_last_3months: 0,
          active_last_6months: 0,
        },
        stats_archived: {
          total: 0,
          private: 0,
          public: 0,
          internal: 0,
          active_last_month: 0,
          active_last_3months: 0,
          active_last_6months: 0,
        },
        stats: null,
        language_statistics_unarchived: {},
        language_statistics_archived: {},
        language_statistics: {},
        radar_entries: [],
        metadata: { last_updated: new Date().toISOString() },
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

  const handleDateChange = (date, repoView = "unarchived") => {
    setCurrentDate(date === "all" ? null : date);
    setCurrentRepoView(repoView);
  };

  const handleTechClick = (tech) => {
    navigate("/radar", { state: { selectedTech: tech } });
  };

  const handleProjectsChange = (repositories) => {
    // Flatten the array of repository URLs by splitting each URL by semicolon
    const allRepoUrls = repositories.flatMap((repoUrl) =>
      repoUrl.split(";").map((url) => {
        const cleanUrl = url.trim().split("#")[0]; // Remove #readme and any other hash parts
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
