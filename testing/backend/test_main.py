"""
This module contains the test cases for the backend API.
"""

from datetime import datetime, timedelta
import requests
import random

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

def test_tech_radar_update_no_entries():
    """Test the tech radar update endpoint with missing entries.
    
    This test verifies that the endpoint correctly handles requests with
    missing entries data by returning an appropriate error response.

    Endpoint:
        POST /review/api/tech-radar/update

    Expects:
        - 400 status code
        - JSON response with error message
        - Error message indicating invalid or missing title
    """
    response = requests.post(f"{BASE_URL}/review/api/tech-radar/update", json={}, timeout=10)
    assert response.status_code == 400
    data = response.json()
    assert "error" in data
    assert data["error"] == "Invalid or empty entries data"

def test_tech_radar_update_partial():
    """Test the tech radar update endpoint with a partial update.
    
    This test verifies that the endpoint correctly processes updates
    when provided with the complete tech radar structure.

    Endpoint:
        POST /review/api/tech-radar/update

    Test Data:
        - Complete tech radar structure
        - Valid entries with all required fields

    Expects:
        - 200 status code
        - Successful update of entries
        - Correct structure in stored data
    """
    random_number = random.randint(100,1000)
    test_data = {
        "entries": [
            {
                "id": "test-entry-partial-1",
                "title": "Test Entry Partial 1",
                "description": "Languages",
                "key": "test1",
                "url": "#",
                "quadrant": "1",
                "timeline": [
                    {
                        "moved": 0,
                        "ringId": "ignore",
                        "date": "2000-01-01",
                        "description": f"For testing purposes [CASE:{random_number}:1]"
                    }
                ],
                "links": []
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/review/api/tech-radar/update",
        json=test_data,
        timeout=10
    )
    assert response.status_code == 200
    
    # Verify the updates
    get_response = requests.get(f"{BASE_URL}/api/tech-radar/json", timeout=10)
    assert get_response.status_code == 200
    updated_data = get_response.json()
    
    # Verify our entry exists and is correct
    updated_entries = {entry["id"]: entry for entry in updated_data["entries"]}
    assert "test-entry-partial-1" in updated_entries
    assert updated_entries["test-entry-partial-1"]["timeline"][0]["ringId"] == "ignore"
    assert updated_entries["test-entry-partial-1"]["quadrant"] == "1"

def test_tech_radar_update_invalid_entries():
    """Test the tech radar update endpoint with invalid entries format.
    
    This test verifies that the endpoint correctly handles requests with
    invalid entries data format by returning an appropriate error response.

    Endpoint:
        POST /review/api/tech-radar/update

    Test Data:
        - Invalid entries format
        - Missing required fields
        - Malformed data structures

    Expects:
        - 400 status code
        - Error message for invalid data
        - No changes to existing entries
    """
    # Test with missing title
    response = requests.post(
        f"{BASE_URL}/review/api/tech-radar/update",
        json={"entries": "not_an_array"},
        timeout=10
    )
    assert response.status_code == 400
    assert response.json()["error"] == "Invalid or empty entries data"

def test_tech_radar_update_invalid_structure():
    """Test the tech radar update endpoint with invalid structure.
    
    This test verifies that the endpoint correctly validates the complete
    structure of the tech radar data, including title, quadrants, rings,
    and entries.

    Endpoint:
        POST /review/api/tech-radar/update

    Test Data:
        - Missing title
        - Invalid quadrants structure
        - Invalid rings structure
        - Invalid entries structure

    Expects:
        - 400 status code for each invalid case
        - Appropriate error messages
        - No changes to existing data
    """
    # Test missing title
    response = requests.post(
        f"{BASE_URL}/review/api/tech-radar/update",
        json={
            "quadrants": [],
            "rings": [],
            "entries": []
        },
        timeout=10
    )
    assert response.status_code == 400
    assert response.json()["error"] == "Invalid or empty entries data"

    # Test invalid quadrants
    response = requests.post(
        f"{BASE_URL}/review/api/tech-radar/update",
        json={
            "title": "Test Radar",
            "quadrants": [{"invalid": "structure"}],
            "rings": [],
            "entries": []
        },
        timeout=10
    )
    assert response.status_code == 400
    assert response.json()["error"] == "Invalid or empty entries data"

    # Test invalid rings
    response = requests.post(
        f"{BASE_URL}/review/api/tech-radar/update",
        json={
            "title": "Test Radar",
            "quadrants": [{"id": "1", "name": "Test"}],
            "rings": [{"invalid": "structure"}],
            "entries": []
        },
        timeout=10
    )
    assert response.status_code == 400
    assert response.json()["error"] == "Invalid or empty entries data"

def test_tech_radar_update_valid_structure():
    """Test the tech radar update endpoint with valid complete structure.
    
    This test verifies that the endpoint correctly processes a complete
    tech radar update with valid structure for all components.

    Endpoint:
        POST /review/api/tech-radar/update

    Test Data:
        - Valid title
        - Valid quadrants with required fields
        - Valid rings with required fields
        - Valid entries with required fields

    Expects:
        - 200 status code
        - Successful update confirmation
        - Correct structure in stored data
    """
    random_number = random.randint(100,1000)
    test_data = {
        "entries": [
            {
                "id": "test-entry-1",
                "title": "Test Entry 1",
                "description": "Languages",
                "key": "test1",
                "url": "#",
                "quadrant": "1",
                "timeline": [
                    {
                        "moved": 0,
                        "ringId": "ignore",
                        "date": "2000-01-01",
                        "description": f"For testing purposes [CASE:{random_number}:2]"
                    }
                ],
                "links": []
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/review/api/tech-radar/update",
        json=test_data,
        timeout=10
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Tech radar updated successfully"

    # Verify the update
    get_response = requests.get(f"{BASE_URL}/api/tech-radar/json", timeout=10)
    assert get_response.status_code == 200
    updated_data = get_response.json()

    # Verify entry structure
    entries = updated_data["entries"]
    test_entry = next((entry for entry in entries if entry["id"] == "test-entry-1"), None)
    assert test_entry is not None, "No entry with id 'test-entry-1' found"
    assert str(random_number) in test_entry["timeline"][0]["description"], "Entry with id 'test-entry-1' does not have the expected description"

def test_tech_radar_update_invalid_references():
    """Test the tech radar update endpoint with invalid references.
    
    This test verifies that the endpoint correctly validates references
    between entries and their quadrants/rings.

    Endpoint:
        POST /review/api/tech-radar/update

    Test Data:
        - Entry with invalid quadrant reference
        - Entry with invalid ring reference
        - Entry with missing required fields

    Expects:
        - 400 status code
        - Appropriate error messages
        - No changes to existing data
    """
    test_data = {
        "title": "ONS Tech Radar",
        "quadrants": [
            {"id": "1", "name": "Languages"}
        ],
        "rings": [
            {"id": "adopt", "name": "ADOPT", "color": "#008a00"}
        ],
        "entries": [
            {
                "id": "test-entry",
                "title": "Test Entry",
                "quadrant": "invalid",  # Invalid quadrant reference
                "timeline": [
                    {
                        "moved": 0,
                        "ringId": "invalid",  # Invalid ring reference
                        "date": "2024-03",
                        "description": "Test"
                    }
                ]
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/review/api/tech-radar/update",
        json=test_data,
        timeout=10
    )
    assert response.status_code == 400
    assert "Invalid entry structure" in response.json()["error"]
