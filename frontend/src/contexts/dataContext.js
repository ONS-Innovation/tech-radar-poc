import React, { createContext, useContext, useState, useRef } from "react";
import { fetchCSVFromS3 } from "../utilities/getCSVData";
import { fetchTechRadarJSONFromS3 } from "../utilities/getTechRadarJson";
import { fetchRepositoryData, fetchRepositoryStats } from "../utilities/getRepositoryData";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [csvData, setCsvData] = useState(null);
  const [techRadarData, setTechRadarData] = useState(null);
  const [repositoryData, setRepositoryData] = useState(new Map());
  const [repositoryStats, setRepositoryStats] = useState(new Map());
  
  const pendingRequests = useRef({
    csv: null,
    techRadar: null,
    repository: new Map(),
    repositoryStats: new Map()
  });

  const getCsvData = async (forceRefresh = false) => {
    
    if (!forceRefresh && csvData) {
      return csvData;
    }

    if (pendingRequests.current.csv) {
      return pendingRequests.current.csv;
    }
    
    const promise = fetchCSVFromS3().then(data => {
      setCsvData(data);
      pendingRequests.current.csv = null;
      return data;
    });

    pendingRequests.current.csv = promise;
    return promise;
  };

  const getTechRadarData = async (forceRefresh = false) => {
    if (!forceRefresh && techRadarData) {
      return techRadarData;
    }

    // If there's already a pending request, return it
    if (pendingRequests.current.techRadar) {
      return pendingRequests.current.techRadar;
    }
    
    // Create new request
    const promise = fetchTechRadarJSONFromS3().then(data => {
      setTechRadarData(data);
      pendingRequests.current.techRadar = null;
      return data;
    });

    pendingRequests.current.techRadar = promise;
    return promise;
  };

  const getRepositoryData = async (repositories, date = null, archived = null, forceRefresh = false) => {
    const cacheKey = JSON.stringify({ repositories, date, archived });
    
    if (!forceRefresh && repositoryData.has(cacheKey)) {
      return repositoryData.get(cacheKey);
    }

    // If there's already a pending request for this exact query, return it
    if (pendingRequests.current.repository.has(cacheKey)) {
      return pendingRequests.current.repository.get(cacheKey);
    }
    
    // Create new request
    const promise = fetchRepositoryData(repositories, date, archived).then(data => {
      setRepositoryData(prev => new Map(prev).set(cacheKey, data));
      pendingRequests.current.repository.delete(cacheKey);
      return data;
    });

    pendingRequests.current.repository.set(cacheKey, promise);
    return promise;
  };

  const getRepositoryStats = async (date = null, archived = null, forceRefresh = false) => {
    const cacheKey = JSON.stringify({ date, archived });

    if (!forceRefresh && repositoryStats.has(cacheKey)) {
      return repositoryStats.get(cacheKey);
    }

    if (pendingRequests.current.repositoryStats.has(cacheKey)) {
      return pendingRequests.current.repositoryStats.get(cacheKey);
    }

    const promise = fetchRepositoryStats(date, archived).then(data => {
      setRepositoryStats(prev => new Map(prev).set(cacheKey, data));
      pendingRequests.current.repositoryStats.delete(cacheKey);
      return data;
    });

    pendingRequests.current.repositoryStats.set(cacheKey, promise);
    return promise;
  };

  const clearCache = () => {
    setCsvData(null);
    setTechRadarData(null);
    setRepositoryData(new Map());
    setRepositoryStats(new Map());
    pendingRequests.current = {
      csv: null,
      techRadar: null,
      repository: new Map(),
      repositoryStats: new Map()
    };
  };

  return (
    <DataContext.Provider 
      value={{
        csvData,
        techRadarData,
        getCsvData,
        getTechRadarData,
        getRepositoryData,
        getRepositoryStats,
        clearCache
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
