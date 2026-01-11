#!/usr/bin/env python
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'esgplatform.settings')
django.setup()

from esgapp.models import ESGSnapshot
from esgapp.serializers import ESGSnapshotSerializer

def test_serializer():
    try:
        # Get the snapshot
        snapshot = ESGSnapshot.objects.get(id=1)
        print(f"Found snapshot: {snapshot.id}")
        
        # Test serializer
        serializer = ESGSnapshotSerializer(snapshot)
        print("Serializer created")
        
        # Get data
        data = serializer.data
        print(f"Serializer data keys: {list(data.keys())}")
        print("Serializer test passed!")
        
        return True
        
    except Exception as e:
        print(f"Serializer error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    test_serializer()