# ESG Resolve Backend

Django REST API backend for the ESG Analytics & Readiness Platform.

## Quick Start

1. Install dependencies: `pip install -r requirements.txt`
2. Set up environment variables in `.env` file
3. Create PostgreSQL database: `CREATE DATABASE esgplatform;`
4. Run migrations: `python manage.py migrate`
5. Start server: `python manage.py runserver`

## Project Structure

```
backend/
├── esgplatform/          # Django project settings
├── esgapp/              # Main application
│   ├── models.py        # Database models
│   ├── serializers.py  # DRF serializers
│   ├── views.py        # API views
│   ├── urls.py         # URL routing
│   ├── esg_engine.py   # ESG scoring engine
│   └── recommendation_engine.py  # Recommendation logic
└── manage.py
```

## Key Models

- **BusinessProfile**: Business information
- **ESGInput**: Raw SME-friendly inputs
- **ESGSnapshot**: ESG assessment snapshot (never overwrites)
- **ESGRecommendation**: Actionable recommendations
- **ESGRoadmap**: 90-day action roadmap
- **ChatSession/ChatMessage**: Chatbot conversations

## ESG Scoring Logic

The platform calculates:
- **Environmental Score** (0-100): Energy, water, waste, renewable energy
- **Social Score** (0-100): Safety training, benefits, diversity, health insurance
- **Governance Score** (0-100): Policies and oversight structures
- **Overall Score**: Weighted average with confidence levels

## API Documentation

See main README.md for endpoint details.

