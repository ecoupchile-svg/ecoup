"""
ECOUP API Backend Tests
Tests for authentication, requests, and user flows
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API_URL = f"{BASE_URL}/api"

# Test credentials from test_credentials.md
USER_EMAIL = "maria@ecoup.com"
USER_PASSWORD = "Test12345!"
RECYCLER_EMAIL = "carlos@ecoup.com"
RECYCLER_PASSWORD = "Test12345!"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_api_root_returns_200(self):
        """Test that API root endpoint is accessible"""
        response = requests.get(f"{API_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "ECOUP" in data["message"]
        print(f"✓ API health check passed: {data['message']}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_user_success(self):
        """Test USER login with valid credentials"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "access_token" in data, "Missing access_token in response"
        assert "user" in data, "Missing user in response"
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 0
        
        # Validate user data
        user = data["user"]
        assert user["email"] == USER_EMAIL
        assert user["role"] == "USER"
        assert "nombre" in user
        assert "id" in user
        print(f"✓ USER login successful: {user['nombre']} ({user['role']})")
    
    def test_login_recycler_success(self):
        """Test RECYCLER login with valid credentials"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": RECYCLER_EMAIL,
            "password": RECYCLER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "access_token" in data
        assert "user" in data
        
        # Validate user data
        user = data["user"]
        assert user["email"] == RECYCLER_EMAIL
        assert user["role"] == "RECYCLER"
        print(f"✓ RECYCLER login successful: {user['nombre']} ({user['role']})")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected with 401")
    
    def test_login_missing_fields(self):
        """Test login with missing fields returns error"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": USER_EMAIL
        })
        assert response.status_code == 422  # Validation error
        print("✓ Missing password correctly rejected with 422")


class TestAuthMe:
    """Test /auth/me endpoint"""
    
    @pytest.fixture
    def user_token(self):
        """Get USER auth token"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Could not get user token")
    
    def test_get_me_with_valid_token(self, user_token):
        """Test /auth/me returns user profile with valid token"""
        response = requests.get(f"{API_URL}/auth/me", headers={
            "Authorization": f"Bearer {user_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "nombre" in data
        assert "role" in data
        print(f"✓ /auth/me returned profile: {data['nombre']}")
    
    def test_get_me_without_token(self):
        """Test /auth/me returns 401 without token"""
        response = requests.get(f"{API_URL}/auth/me")
        assert response.status_code == 401
        print("✓ /auth/me correctly rejected without token")
    
    def test_get_me_with_invalid_token(self):
        """Test /auth/me returns 401 with invalid token"""
        response = requests.get(f"{API_URL}/auth/me", headers={
            "Authorization": "Bearer invalid_token_here"
        })
        assert response.status_code == 401
        print("✓ /auth/me correctly rejected invalid token")


class TestUserRequests:
    """Test requests endpoints for USER role"""
    
    @pytest.fixture
    def user_auth(self):
        """Get USER auth token and user data"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return {"token": data["access_token"], "user": data["user"]}
        pytest.skip("Could not authenticate user")
    
    def test_get_user_requests(self, user_auth):
        """Test GET /requests returns user's requests"""
        response = requests.get(f"{API_URL}/requests", headers={
            "Authorization": f"Bearer {user_auth['token']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /requests returned {len(data)} requests")
        
        # Validate request structure if any exist
        if len(data) > 0:
            req = data[0]
            assert "id" in req
            assert "title" in req
            assert "address" in req
            assert "status" in req
            print(f"  First request: {req['title']} - {req['status']}")
    
    def test_create_request(self, user_auth):
        """Test POST /requests creates a new request"""
        request_data = {
            "title": "TEST_Botellas PET para reciclar",
            "description": "Aproximadamente 20 botellas",
            "waste_type": "Plastico",
            "address": "Calle Test 123, Colonia Centro",
            "latitude": 19.4326,
            "longitude": -99.1332
        }
        
        response = requests.post(f"{API_URL}/requests", 
            json=request_data,
            headers={"Authorization": f"Bearer {user_auth['token']}"}
        )
        assert response.status_code == 200, f"Create request failed: {response.text}"
        data = response.json()
        
        # Validate response
        assert "id" in data
        assert data["title"] == request_data["title"]
        assert data["address"] == request_data["address"]
        assert data["status"] == "PENDING"
        assert data["user_id"] == user_auth["user"]["id"]
        print(f"✓ Created request: {data['id']}")
        
        # Verify persistence with GET
        get_response = requests.get(f"{API_URL}/requests/{data['id']}", headers={
            "Authorization": f"Bearer {user_auth['token']}"
        })
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["title"] == request_data["title"]
        print(f"✓ Verified request persisted: {fetched['title']}")
        
        return data["id"]
    
    def test_get_request_by_id(self, user_auth):
        """Test GET /requests/{id} returns specific request"""
        # First get list of requests
        list_response = requests.get(f"{API_URL}/requests", headers={
            "Authorization": f"Bearer {user_auth['token']}"
        })
        requests_list = list_response.json()
        
        if len(requests_list) == 0:
            pytest.skip("No requests to test")
        
        request_id = requests_list[0]["id"]
        response = requests.get(f"{API_URL}/requests/{request_id}", headers={
            "Authorization": f"Bearer {user_auth['token']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == request_id
        print(f"✓ GET /requests/{request_id} returned correct request")


class TestRecyclerRequests:
    """Test requests endpoints for RECYCLER role"""
    
    @pytest.fixture
    def recycler_auth(self):
        """Get RECYCLER auth token and user data"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": RECYCLER_EMAIL,
            "password": RECYCLER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return {"token": data["access_token"], "user": data["user"]}
        pytest.skip("Could not authenticate recycler")
    
    def test_get_available_requests(self, recycler_auth):
        """Test GET /requests/available returns pending requests for recycler"""
        response = requests.get(f"{API_URL}/requests/available", headers={
            "Authorization": f"Bearer {recycler_auth['token']}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /requests/available returned {len(data)} requests")
        
        # Validate request structure if any exist
        if len(data) > 0:
            req = data[0]
            assert "id" in req
            assert "title" in req
            assert "status" in req
            # Should be PENDING or assigned to this recycler
            assert req["status"] == "PENDING" or req.get("recycler_id") == recycler_auth["user"]["id"]
            print(f"  First available: {req['title']} - {req['status']}")
    
    def test_accept_request(self, recycler_auth):
        """Test PATCH /requests/{id} to accept a request"""
        # Get available requests
        available_response = requests.get(f"{API_URL}/requests/available", headers={
            "Authorization": f"Bearer {recycler_auth['token']}"
        })
        available = available_response.json()
        
        # Find a PENDING request
        pending = [r for r in available if r["status"] == "PENDING"]
        if len(pending) == 0:
            pytest.skip("No pending requests to accept")
        
        request_id = pending[0]["id"]
        
        # Accept the request
        response = requests.patch(f"{API_URL}/requests/{request_id}",
            json={
                "status": "ACCEPTED",
                "recycler_id": recycler_auth["user"]["id"]
            },
            headers={"Authorization": f"Bearer {recycler_auth['token']}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ACCEPTED"
        assert data["recycler_id"] == recycler_auth["user"]["id"]
        print(f"✓ Recycler accepted request: {request_id}")


class TestRequestsWithoutAuth:
    """Test that requests endpoints require authentication"""
    
    def test_get_requests_without_auth(self):
        """Test GET /requests returns 401 without auth"""
        response = requests.get(f"{API_URL}/requests")
        assert response.status_code == 401
        print("✓ GET /requests correctly requires auth")
    
    def test_create_request_without_auth(self):
        """Test POST /requests returns 401 without auth"""
        response = requests.post(f"{API_URL}/requests", json={
            "title": "Test",
            "address": "Test Address"
        })
        assert response.status_code == 401
        print("✓ POST /requests correctly requires auth")
    
    def test_get_available_without_auth(self):
        """Test GET /requests/available returns 401 without auth"""
        response = requests.get(f"{API_URL}/requests/available")
        assert response.status_code == 401
        print("✓ GET /requests/available correctly requires auth")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
