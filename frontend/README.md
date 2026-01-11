# ESG Resolve Frontend

React frontend for the ESG Analytics & Readiness Platform.

## Quick Start

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open `http://localhost:3000`

## Project Structure

```
frontend/
├── src/
│   ├── pages/          # Page components
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── BusinessSetupPage.jsx
│   │   ├── ESGFormPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── RecommendationsPage.jsx
│   │   ├── ChatbotPage.jsx
│   │   ├── RoadmapPage.jsx
│   │   └── ReportPage.jsx
│   ├── components/     # Reusable components
│   ├── contexts/       # React contexts (Auth)
│   ├── utils/          # API utilities
│   └── App.jsx         # Main app component
└── package.json
```

## Features

- Multi-step ESG input form
- Interactive dashboard with charts
- Recommendations view
- AI chatbot interface
- Roadmap timeline view
- Report generation

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

