# AppFolio to Snowflake Data Pipeline

## Overview

A TypeScript-based data pipeline that automates data synchronization between AppFolio and Snowflake, with integrated Tableau refresh capabilities.

## Features

- Automated data synchronization between AppFolio and Snowflake
- Configurable execution window (7 AM - 10 PM EST)
- Built-in retry mechanism for failed operations
- REST API for pipeline control
- Tableau extract refresh automation
- Comprehensive logging system
- Batch processing with configurable sizes
- Support for multiple report types

## Prerequisites

- Node.js (v14 or higher)
- TypeScript
- AppFolio API credentials
- Snowflake account
- Tableau Server access

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd appfolio-snowflake
```

2. Install dependencies:

```bash
npm install
```

3. Create `.env` file:

```plaintext
# AppFolio Configuration
APPFOLIO_CLIENT_ID=your_client_id
APPFOLIO_CLIENT_SECRET=your_client_secret
APPFOLIO_API_KEY=your_api_key

# Snowflake Configuration
SNOWFLAKE_ACCOUNT=your_account
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_DATABASE=your_database
SNOWFLAKE_SCHEMA=your_schema
SNOWFLAKE_WAREHOUSE=your_warehouse

# Tableau Configuration
TABLEAU_SERVER=your_tableau_server
TABLEAU_SITE_ID=your_tableau_site_id
TABLEAU_WORKBOOK_ID=your_tableau_workbook_id
TABLEAU_PAT_NAME=your_pat_name
TABLEAU_PAT_SECRET=your_pat_secret

# API Configuration
PORT=3000
```

## Project Structure

```plaintext
src/
├── api/
│   ├── controllers/
│   ├── routes/
│   └── index.ts
├── clients/
│   ├── appfolioClient.ts
│   └── snowflakeClient.ts
├── config/
├── const/
├── services/
├── types/
├── utils/
└── index.ts
```

## Usage

1. Build the project:

```bash
npm run build
```

2. Start in production mode:

```bash
npm start
```

3. Development mode:

```bash
npm run dev
```

## API Endpoints

### Reset General Ledger State

```bash
curl -X POST -H "Content-Type: application/json" http://localhost:3000/api/reset-general-ledger
```

## Pipeline Schedule

- Runs every hour between 7 AM and 10 PM EST
- Automatically pauses outside operating hours
- Resumes at 7 AM the next day

## Error Handling

- Built-in retry mechanism (3 attempts)
- Comprehensive logging to `logs/` directory
- Failed operations don't stop the entire pipeline
- Error notifications via logging system

## Development

1. Start development servers:

```bash
npm run dev
```

2. Build for production:

```bash
npm run build
```

3. Start production servers:

```bash
npm start
```

## Scripts

- `npm start` - Run production build
- `npm run dev` - Run development mode
- `npm run build` - Build TypeScript files
- `npm run start:api` - Run API server only
- `npm run start:pipeline` - Run pipeline only

## Logging

Logs are written to:

- `logs/error.log` - Error events
- `logs/combined.log` - All events
- Console output in development mode

## License

ISC
