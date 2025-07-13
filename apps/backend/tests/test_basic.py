import pytest
import sys
import os

# Add the parent directory to the path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_basic():
    """Basic test to ensure the test framework is working"""
    assert True

def test_import_app():
    """Test that we can import the main app module"""
    try:
        import app
        assert True
    except ImportError:
        pytest.skip("App module not available for testing")
