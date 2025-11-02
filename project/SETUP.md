# Aegis AI - Setup Guide

## Overview

Aegis AI is a full-stack autonomous cloud-operations monitoring and self-healing system that uses machine learning to detect anomalies and automatically trigger recovery actions.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS + Chart.js
- **Backend**: Node.js + Express + WebSocket
- **AI Service**: Python Flask + scikit-learn (Isolation Forest)
- **Database**: Supabase (PostgreSQL)

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- pip (Python package manager)

## Installation Steps

### 1. Install Node Dependencies

```bash
npm install
```

### 2. Set Up Python AI Service

```bash
cd ai-service
pip install -r requirements.txt
```

## Running the Application

You need to run THREE services simultaneously:

### Terminal 1: Python AI Service

```bash
cd ai-service
python app.py
```

This starts the Flask AI service on `http://localhost:5000`

The service will:
- Train an Isolation Forest model on startup
- Provide `/predict` endpoint for anomaly detection
- Provide `/health` endpoint for health checks

### Terminal 2: Node.js Backend Server

```bash
npm run server
```

This starts the Express server on `http://localhost:3000`

The server will:
- Generate random metrics every 5 seconds
- Call the AI service to detect anomalies
- Automatically trigger self-healing actions when anomalies are detected
- Broadcast real-time updates via WebSocket

### Terminal 3: React Frontend (Development)

```bash
npm run dev
```

This starts the Vite development server (typically on `http://localhost:5173`)

## How It Works

1. **Metric Generation**: The backend generates simulated CPU, memory, and network metrics every 5 seconds

2. **Anomaly Detection**: Each metric is sent to the Python AI service, which uses an Isolation Forest model to detect anomalies

3. **Self-Healing**: When an anomaly is detected with a high confidence score:
   - An incident is created and marked as "detected"
   - The system automatically transitions to "healing" status
   - A healing action is triggered (simulated service restart)
   - The incident is marked as "recovered" or "failed" based on the outcome

4. **Real-Time Updates**: The frontend receives live updates via WebSocket and displays:
   - Current metric values with color-coded status
   - Live charts for CPU, memory, and network usage
   - Active alerts (red for detected, orange for healing, green for recovered)
   - Action log showing the full incident timeline

## Database Schema

The system uses three main tables in Supabase:

- **metrics**: Stores time-series metrics data
- **incidents**: Tracks detected anomalies and their resolution status
- **actions**: Logs self-healing actions taken by the system

## Features

- Live metric visualization with Chart.js
- Anomaly detection using machine learning
- Automated self-healing workflows
- Real-time WebSocket updates
- Color-coded alert system (red → orange → green)
- Comprehensive action logging
- Responsive dashboard design

## Troubleshooting

### AI Service Connection Issues

If the backend shows "AI service unavailable":
- Ensure Python Flask service is running on port 5000
- Check for port conflicts
- Verify all Python dependencies are installed

### WebSocket Connection Issues

If the frontend shows "disconnected":
- Ensure the Node.js server is running on port 3000
- Check browser console for WebSocket errors
- Verify CORS settings if running on different ports

### Database Issues

- Verify Supabase connection details in `.env`
- Check that all migrations have been applied
- Ensure RLS policies are properly configured

## Production Build

To build the frontend for production:

```bash
npm run build
```

The built files will be in the `dist` directory.
