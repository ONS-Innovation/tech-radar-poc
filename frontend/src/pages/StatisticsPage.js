import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Statistics from "../components/Statistics/Statistics";
import Header from "../components/Header/Header";
import { ThemeProvider } from "../contexts/ThemeContext";
import { fetchTechRadarJSONFromS3 } from "../utilities/getTechRadarJson";
import { fetchCSVFromS3 } from "../utilities/getCSVData";
import { fetchRepositoryData } from "../utilities/getRepositoryData";
import { toast } from "react-hot-toast";
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
  const [currentRepoView, setCurrentRepoView] = useState("unarchived");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await fetchCSVFromS3();
        setProjectsData(data);
      } catch (error) {
        toast.error("Error fetching projects.");
      }
    };

    fetchProjects();
  }, []);

  /**
   * fetchStatistics function to fetch the statistics data.
   *
   * @param {string|null} date - The date to fetch the statistics for.
   * @param {string} repoView - The repository view to fetch the statistics for.
   */
  const fetchStatistics = async (date = null, repoView = "unarchived") => {
    setIsLoading(true);
    try {
      const baseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:5001/api/json"
          : "/api/json";

      let statsResponse, radarResponse;
      radarResponse = await fetchTechRadarJSONFromS3();

      if (selectedRepositories.length > 0) {
        // Extract repository names from the URLs
        const repoNames = selectedRepositories
          .map((repoUrl) => {
            const match = repoUrl.match(/github\.com\/[^/]+\/([^/]+)/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        // Fetch repository-specific data with all active filters
        const archived =
          repoView === "archived"
            ? "true"
            : repoView === "unarchived"
              ? "false"
              : null;
        const repoResponse = await fetchRepositoryData(
          repoNames,
          date,
          archived
        );

        if (!repoResponse?.repositories) {
          throw new Error("Failed to fetch repository data");
        }

        statsResponse = {
          ok: true,
          json: () =>
            Promise.resolve({
              stats: repoResponse.stats,
              language_statistics: repoResponse.language_statistics,
              metadata: repoResponse.metadata,
            }),
        };
      } else {
        // Construct URL with parameters for general statistics
        const params = new URLSearchParams();
        if (date && date !== "all") params.append("datetime", date);
        if (repoView === "archived") params.append("archived", "true");
        else if (repoView === "unarchived") params.append("archived", "false");

        const url = params.toString()
          ? `${baseUrl}?${params.toString()}`
          : baseUrl;

        statsResponse = await fetch(url);
      }

      if (!statsResponse.ok || !radarResponse) {
        throw new Error("Failed to fetch data");
      }

      const [statsData, radarData] = await Promise.all([
        statsResponse.json(),
        radarResponse,
      ]);

      if (!statsData.stats && !statsData.language_statistics) {
        throw new Error("Invalid response format");
      }

      const mappedStats = {
        stats_unarchived:
          repoView === "unarchived"
            ? {
                total: statsData.stats?.total_repos || 0,
                private: statsData.stats?.total_private_repos || 0,
                public: statsData.stats?.total_public_repos || 0,
                internal: statsData.stats?.total_internal_repos || 0,
                active_last_month: 0,
                active_last_3months: 0,
                active_last_6months: 0,
              }
            : {},
        stats_archived:
          repoView === "archived"
            ? {
                total: statsData.stats?.total_repos || 0,
                private: statsData.stats?.total_private_repos || 0,
                public: statsData.stats?.total_public_repos || 0,
                internal: statsData.stats?.total_internal_repos || 0,
                active_last_month: 0,
                active_last_3months: 0,
                active_last_6months: 0,
              }
            : {},
        stats:
          repoView === "total"
            ? {
                total: statsData.stats?.total_repos || 0,
                private: statsData.stats?.total_private_repos || 0,
                public: statsData.stats?.total_public_repos || 0,
                internal: statsData.stats?.total_internal_repos || 0,
                active_last_month: 0,
                active_last_3months: 0,
                active_last_6months: 0,
              }
            : null,
        language_statistics_unarchived:
          repoView === "unarchived" ? statsData.language_statistics || {} : {},
        language_statistics_archived:
          repoView === "archived" ? statsData.language_statistics || {} : {},
        language_statistics:
          repoView === "total" ? statsData.language_statistics || {} : {},
        radar_entries: radarData.entries,
        metadata: statsData.metadata || {
          last_updated: new Date().toISOString(),
        },
      };

      setStatsData(mappedStats);
    } catch (error) {
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

  // Update useEffect to use current filters
  useEffect(() => {
    fetchStatistics(currentDate, currentRepoView);
  }, [selectedRepositories, currentDate, currentRepoView]);

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

  return (
    <ThemeProvider>
      <Header
        searchTerm=""
        onSearchChange={() => {}}
        searchResults={[]}
        onSearchResultClick={() => {}}
        hideSearch={true}
        onOpenProjects={() => setIsProjectsModalOpen(!isProjectsModalOpen)}
      />
      <div className="statistics-page">
        <Statistics
          data={statsData}
          onTechClick={handleTechClick}
          onDateChange={handleDateChange}
          isLoading={isLoading}
          projectsData={projectsData}
          onProjectsChange={handleProjectsChange}
        />
      </div>
    </ThemeProvider>
  );
}

export default StatisticsPage;
