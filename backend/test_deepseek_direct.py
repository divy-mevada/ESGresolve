import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def test_groq_direct():
    """Test Groq API directly using requests"""
    api_key = os.getenv('GROQ_API_KEY')
    base_url = 'https://api.groq.com/openai/v1'
    
    print(f"Testing Groq API...")
    print(f"API Key: {api_key[:10]}..." if api_key else "No API key found")
    print(f"Base URL: {base_url}")
    
    if not api_key:
        print("ERROR: No API key found in environment")
        return False
    
    # Test endpoint
    url = f"{base_url}/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "user", "content": "Hello, respond with 'Connection successful'"}
        ],
        "max_tokens": 20
    }
    
    try:
        print("Sending test request...")
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            message = data['choices'][0]['message']['content']
            print(f"SUCCESS: {message}")
            return True
        else:
            print(f"ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    test_groq_direct()