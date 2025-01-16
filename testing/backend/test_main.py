import pytest
import requests
from datetime import datetime, timedelta
import json

BASE_URL = "http://localhost:5001"

def test_health_check():
    """Test the health check endpoint"""
    response = requests.get(f"{BASE_URL}/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
    assert "uptime" in data
    assert "memory" in data
    assert "pid" in data

def test_csv_endpoint():
    """Test the CSV data endpoint"""
    response = requests.get(f"{BASE_URL}/api/csv")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        # Check if the first item has expected structure
        first_item = data[0]
        assert isinstance(first_item, dict)
        assert len(first_item.keys()) > 1  # Verify it's not empty

def test_json_endpoint_no_params():
    """Test the JSON endpoint without any parameters"""
    response = requests.get(f"{BASE_URL}/api/json")
    assert response.status_code == 200
    data = response.json()
    assert "stats" in data
    assert "language_statistics" in data
    assert "metadata" in data
    
    # Verify stats structure
    stats = data["stats"]
    assert "total_repos" in stats
    assert "total_private_repos" in stats
    assert "total_public_repos" in stats
    assert "total_internal_repos" in stats

def test_json_endpoint_with_datetime():
    """Test the JSON endpoint with datetime parameter"""
    # Test with last 7 days
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    response = requests.get(f"{BASE_URL}/api/json", params={"datetime": seven_days_ago})
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["filter_date"] == seven_days_ago

def test_json_endpoint_with_archived():
    """Test the JSON endpoint with archived parameter"""
    # Test with archived=true
    response = requests.get(f"{BASE_URL}/api/json", params={"archived": "true"})
    assert response.status_code == 200
    
    # Test with archived=false
    response = requests.get(f"{BASE_URL}/api/json", params={"archived": "false"})
    assert response.status_code == 200

def test_json_endpoint_combined_params():
    """Test the JSON endpoint with both datetime and archived parameters"""
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
    params = {
        "datetime": seven_days_ago,
        "archived": "false"
    }
    response = requests.get(f"{BASE_URL}/api/json", params=params)
    assert response.status_code == 200
    data = response.json()
    assert data["metadata"]["filter_date"] == seven_days_ago

def test_invalid_endpoint():
    """Test an invalid endpoint to ensure proper error handling"""
    response = requests.get(f"{BASE_URL}/api/nonexistent")
    assert response.status_code in [404, 500]  # Either is acceptable

def test_json_endpoint_invalid_date():
    """Test the JSON endpoint with an invalid date parameter"""
    response = requests.get(f"{BASE_URL}/api/json", params={"datetime": "invalid-date"})
    assert response.status_code == 200  # Backend handles invalid dates gracefully
    data = response.json()
    # Verify that the invalid date was ignored (filter_date should be null)
    assert data["metadata"]["filter_date"] is None
    # Verify we still get valid stats
    assert "stats" in data
    assert "language_statistics" in data

if __name__ == "__main__":
    pytest.main(["-v"]) 