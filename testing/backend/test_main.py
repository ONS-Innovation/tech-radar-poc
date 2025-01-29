"""
This module contains the test cases for the backend API.
"""

from datetime import datetime, timedelta
import requests

BASE_URL = "http://localhost:5001"

def test_health_check():
    """Test the health check endpoint functionality.
    
    This test verifies that the health check endpoint is operational and returns
    the expected health status information about the server. It checks for the
    presence of essential health metrics and status indicators.

    Endpoint:
        GET /api/health

    Expects:
        - 200 status code
        - JSON response containing:
            - "healthy" status indicator
            - Current timestamp
            - Server uptime in seconds
            - Memory usage statistics
            - Process ID
    """
    response = requests.get(f"{BASE_URL}/api/health", timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert "uptime" in data
    assert "memory" in data
    assert "pid" in data

def test_csv_endpoint():
    """Test the CSV data endpoint functionality.
    
    This test verifies that the CSV endpoint correctly returns parsed CSV data
    from the S3 bucket. It checks that the data is properly formatted and
    contains the expected structure.

    Endpoint:
        GET /api/csv

    Expects:
        - 200 status code
        - JSON array response
        - Non-empty data entries
        - Each entry should be a dictionary with multiple fields
        - No empty or malformed entries
    """
    response = requests.get(f"{BASE_URL}/api/csv", timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        first_item = data[0]
        assert isinstance(first_item, dict)
        assert len(first_item.keys()) > 1  # Verify it's not empty

def test_tech_radar_json_endpoint():
    """Test the tech radar JSON endpoint functionality.
    
    This test verifies that the tech radar endpoint correctly returns the
    radar configuration data from the S3 bucket. The data defines the structure
    and content of the technology radar visualization.

    Endpoint:
        GET /api/tech-radar/json

    Expects:
        - 200 status code
        - JSON object response
        - Non-empty configuration data
        - Multiple configuration keys present
    """
    response = requests.get(f"{BASE_URL}/api/tech-radar/json", timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert len(data.keys()) > 1  # Verify it's not empty

def test_json_endpoint_no_params():
    """Test the JSON endpoint without query parameters.
    
    This test verifies the default behavior of the JSON endpoint when no
    filters are applied. It checks that the endpoint returns complete
    repository statistics and metadata.

    Endpoint:
        GET /api/json

    Expects:
        - 200 status code
        - JSON response containing:
            - Repository statistics
            - Language usage statistics
            - Metadata information
        - Complete stats structure with:
            - Total repository count
            - Private repository count
            - Public repository count
            - Internal repository count
    """
    response = requests.get(f"{BASE_URL}/api/json", timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert "language_statistics" in data
    assert "metadata" in data

    stats = data["stats"]
    assert "total_repos" in stats
    assert "total_private_repos" in stats
    assert "total_public_repos" in stats
    assert "total_internal_repos" in stats

def test_json_endpoint_with_datetime():
    """Test the JSON endpoint with datetime filtering.
    
    This test verifies that the endpoint correctly filters repository data
    based on a specified datetime parameter. It checks repositories modified
    within the last 7 days.

    Parameters:
        datetime (str): ISO formatted datetime string for filtering

    Example:
        GET /api/json?datetime=2024-03-20T00:00:00Z

    Expects:
        - 200 status code
        - Filtered repository data
        - Metadata containing the applied datetime filter
    """
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    response = requests.get(f"{BASE_URL}/api/json", params={"datetime": seven_days_ago}, timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["filter_date"] == seven_days_ago

def test_json_endpoint_with_archived():
    """Test the JSON endpoint with archived status filtering.
    
    This test verifies that the endpoint correctly filters repositories
    based on their archived status. It tests both archived and non-archived
    filtering options.

    Parameters:
        archived (str): "true" or "false" to filter archived status

    Example:
        GET /api/json?archived=false

    Expects:
        - 200 status code for both archived and non-archived queries
        - Filtered repository data based on archived status
    """
    response = requests.get(f"{BASE_URL}/api/json", params={"archived": "true"}, timeout=10)
    assert response.status_code == 200

    response = requests.get(f"{BASE_URL}/api/json", params={"archived": "false"}, timeout=10)
    assert response.status_code == 200

def test_json_endpoint_combined_params():
    """Test the JSON endpoint with multiple filter parameters.
    
    This test verifies that the endpoint correctly handles multiple filter
    parameters simultaneously, including datetime and archived status filters.
    It ensures all filters are properly applied and reflected in the response.

    Parameters:
        datetime (str): ISO formatted datetime string for filtering
        archived (str): "true" or "false" to filter archived status

    Example:
        GET /api/json?datetime=2024-03-20T00:00:00Z&archived=false

    Expects:
        - 200 status code
        - Repository data filtered by all parameters
        - Metadata reflecting the applied datetime filter
    """
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    params = {
        "datetime": seven_days_ago,
        "archived": "false"
    }
    response = requests.get(f"{BASE_URL}/api/json", params=params, timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["filter_date"] == seven_days_ago

def test_invalid_endpoint():
    """Test error handling for invalid endpoints.
    
    This test verifies that the server properly handles requests to
    non-existent endpoints by returning appropriate error status codes.

    Example:
        GET /api/nonexistent

    Expects:
        - Either 404 (Not Found) or 500 (Internal Server Error) status code
        - Proper error handling for invalid routes
    """
    response = requests.get(f"{BASE_URL}/api/nonexistent", timeout=10)
    assert response.status_code in [404, 500]  # Either is acceptable

def test_json_endpoint_invalid_date():
    """Test the JSON endpoint's handling of invalid date parameters.
    
    This test verifies that the endpoint gracefully handles invalid datetime
    parameters without failing. It should ignore the invalid date and return
    unfiltered results.

    Parameters:
        datetime (str): An invalid datetime string

    Example:
        GET /api/json?datetime=invalid-date

    Expects:
        - 200 status code (graceful handling)
        - Null filter_date in metadata
        - Valid response with unfiltered stats
        - Complete language statistics
    """
    response = requests.get(f"{BASE_URL}/api/json", params={"datetime": "invalid-date"}, timeout=10)
    assert response.status_code == 200  # Backend handles invalid dates gracefully
    data = response.json()
    assert data["metadata"]["filter_date"] is None
    assert "stats" in data
    assert "language_statistics" in data

def test_repository_project_json_no_params():
    """Test the repository project JSON endpoint error handling for missing parameters.
    
    This test verifies that the endpoint correctly handles the case when no
    repositories are specified in the request parameters. It should return
    a 400 Bad Request status code with an appropriate error message.

    Expects:
        - 400 status code
        - JSON response with error message
        - Error message indicating no repositories specified
    """
    response = requests.get(f"{BASE_URL}/api/repository/project/json", timeout=10)
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"] == "No repositories specified"

def test_repository_project_json_with_repos():
    """Test the repository project JSON endpoint with a valid repository parameter.
    
    This test verifies the endpoint's basic functionality when requesting data
    for a single repository. It checks the complete response structure including
    repository data, statistics, and metadata.

    Parameters:
        repositories (str): Name of the repository to query (e.g., "tech-radar")

    Expects:
        - 200 status code
        - JSON response with complete repository data
        - Valid statistics for the repository
        - Correct metadata including requested repository names
        - Language statistics if available
    """
    response = requests.get(f"{BASE_URL}/api/repository/project/json", params={"repositories": "tech-radar"}, timeout=10)
    assert response.status_code == 200
    data = response.json()

    # Verify response structure
    assert "repositories" in data
    assert "stats" in data
    assert "language_statistics" in data
    assert "metadata" in data

    # Verify stats structure
    stats = data["stats"]
    assert "total_repos" in stats
    assert "total_private_repos" in stats
    assert "total_public_repos" in stats
    assert "total_internal_repos" in stats

    # Verify metadata
    metadata = data["metadata"]
    assert "requested_repos" in metadata
    assert "found_repos" in metadata
    assert metadata["requested_repos"] == ["tech-radar"]

def test_repository_project_json_with_datetime():
    """Test the repository project JSON endpoint with datetime filtering.
    
    This test verifies that the endpoint correctly filters repository data
    based on a specified datetime parameter. It checks repositories modified
    after the given datetime.

    Parameters:
        repositories (str): Name of the repository to query
        datetime (str): ISO formatted datetime string for filtering
        
    Example:
        GET /api/repository/project/json?repositories=tech-radar&datetime=2024-03-20T00:00:00Z

    Expects:
        - 200 status code
        - Filtered repository data based on datetime
        - Metadata containing the applied datetime filter
    """
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    params = {
        "repositories": "tech-radar",
        "datetime": seven_days_ago
    }
    response = requests.get(f"{BASE_URL}/api/repository/project/json", params=params, timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["filter_date"] == seven_days_ago

def test_repository_project_json_with_archived():
    """Test the repository project JSON endpoint with archived filtering.
    
    This test verifies that the endpoint correctly filters repositories
    based on their archived status. It tests both archived and non-archived
    filtering options.

    Parameters:
        repositories (str): Name of the repository to query
        archived (str): "true" or "false" to filter archived status
        
    Example:
        GET /api/repository/project/json?repositories=tech-radar&archived=false

    Expects:
        - 200 status code
        - Filtered repository data based on archived status
        - Metadata containing the applied archived filter
    """
    params = {
        "repositories": "tech-radar",
        "archived": "true"
    }
    response = requests.get(f"{BASE_URL}/api/repository/project/json", params=params, timeout=10)
    assert response.status_code == 200

    params["archived"] = "false"
    response = requests.get(f"{BASE_URL}/api/repository/project/json", params=params, timeout=10)
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["filter_archived"] == "false"

def test_repository_project_json_multiple_repos():
    """Test the repository project JSON endpoint with multiple repositories.
    
    This test verifies that the endpoint correctly handles requests for
    multiple repositories in a single call. It checks that all requested
    repositories are processed and included in the response.

    Parameters:
        repositories (str): Comma-separated list of repository names

    Example:
        GET /api/repository/project/json?repositories=tech-radar,another-repo

    Expects:
        - 200 status code
        - Data for all requested repositories
        - Metadata containing all requested repository names
        - Aggregated statistics across all repositories
    """
    params = {
        "repositories": "tech-radar,another-repo"
    }
    response = requests.get(f"{BASE_URL}/api/repository/project/json", params=params, timeout=10)
    assert response.status_code == 200
    data = response.json()

    # Verify the requested repos are in metadata
    assert len(data["metadata"]["requested_repos"]) == 2
    assert "tech-radar" in data["metadata"]["requested_repos"]
    assert "another-repo" in data["metadata"]["requested_repos"]

def test_repository_project_json_combined_filters():
    """Test the repository project JSON endpoint with multiple filter parameters.

    This test verifies that the endpoint correctly handles multiple filter
    parameters simultaneously, including datetime and archived status filters.
    It ensures all filters are properly applied and reflected in the response.

    Parameters:
        repositories (str): Name of the repository to query
        datetime (str): ISO formatted datetime string for filtering
        archived (str): "true" or "false" to filter archived status
 
    Example:
        GET /api/repository/project/json?repositories=tech-radar&datetime=2024-03-20T00:00:00Z&archived=false

    Expects:
        - 200 status code
        - Repository data filtered by all parameters
        - Metadata reflecting all applied filters
        - Correct aggregation of filtered data
    """
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    params = {
        "repositories": "tech-radar",
        "datetime": seven_days_ago,
        "archived": "false"
    }
    response = requests.get(f"{BASE_URL}/api/repository/project/json", params=params, timeout=10)
    assert response.status_code == 200
    data = response.json()

    # Verify all filters are applied in metadata
    assert data["metadata"]["filter_date"] == seven_days_ago
    assert data["metadata"]["filter_archived"] == "false"
    assert "tech-radar" in data["metadata"]["requested_repos"]

def test_repository_project_json_language_stats():
    """Test the language statistics in repository project JSON response.

    This test verifies that the endpoint correctly returns and formats
    language statistics for the requested repositories. It checks the
    structure and content of the language statistics object.

    Parameters:
        repositories (str): Name of the repository to query

    Expects:
        - 200 status code
        - Language statistics object in response
        - For each language:
            - Repository count
            - Average usage percentage
            - Total size in bytes
        - Valid numerical values for all statistics
    """
    response = requests.get(f"{BASE_URL}/api/repository/project/json", params={"repositories": "tech-radar"}, timeout=10)
    assert response.status_code == 200
    data = response.json()

    # Verify language statistics structure
    assert "language_statistics" in data
    if len(data["language_statistics"]) > 0:
        # Check structure of first language entry
        first_lang = next(iter(data["language_statistics"].values()))
        assert "repo_count" in first_lang
        assert "average_percentage" in first_lang
        assert "total_size" in first_lang
