# Requirements Document: Production Deployment Setup

## Introduction

This document defines the requirements for deploying the Shiftly/Dayflow HRMS application to production environments. The system consists of a Next.js 14 frontend, Express.js backend API with Prisma ORM, and PostgreSQL 16 database. The deployment must ensure high availability, security, and cost-effectiveness suitable for an SME HRMS application handling sensitive employee data.

## Glossary

- **Shiftly_System**: The complete HRMS application comprising Frontend_Service, Backend_API, and Database_Service
- **Frontend_Service**: The Next.js 14 application serving the user interface (React 19, Tailwind CSS)
- **Backend_API**: The Express.js REST API service with Prisma ORM for data access
- **Database_Service**: PostgreSQL 16 database instance storing all application data
- **Deployment_Platform**: Cloud hosting provider (Render, Vercel, Railway, etc.)
- **Environment_Variables**: Configuration values for DATABASE_URL, JWT_SECRET, API endpoints, AI keys
- **CI_CD_Pipeline**: Automated build, test, and deployment workflow
- **Production_Environment**: Live production deployment accessible to end users
- **Staging_Environment**: Pre-production environment for testing before production release
- **SSL_Certificate**: TLS/SSL certificate for HTTPS encryption
- **Custom_Domain**: Organization-specific domain name (e.g., hrms.company.com)
- **Database_Migration**: Prisma migration process to update database schema
- **Health_Check**: Endpoint monitoring service availability (/api/health)
- **Backup_Service**: Automated database backup system
- **Monitoring_Service**: Application performance and error tracking system
- **Log_Aggregation**: Centralized logging system for debugging and audit trails
- **CORS_Policy**: Cross-Origin Resource Sharing configuration for Frontend-Backend communication
- **Rate_Limiting**: API request throttling to prevent abuse
- **Prisma_Generate**: Command to generate Prisma client code (npx prisma generate)
- **Database_Deploy**: Command to apply migrations in production (prisma migrate deploy)

## Requirements

### Requirement 1: Backend API Hosting

**User Story:** As a system administrator, I want to deploy the Backend API to a reliable hosting platform, so that the API is available 24/7 with automatic scaling and minimal downtime.

#### Acceptance Criteria

1. THE Backend_API SHALL be deployed to a Node.js-compatible Deployment_Platform
2. WHEN the Backend_API starts, THE Deployment_Platform SHALL execute Prisma_Generate before starting the server
3. THE Backend_API SHALL expose the Health_Check endpoint at /api/health
4. THE Deployment_Platform SHALL automatically restart the Backend_API if it crashes
5. THE Backend_API SHALL use PORT environment variable provided by the Deployment_Platform
6. THE Backend_API SHALL serve requests over HTTPS with a valid SSL_Certificate
7. THE Backend_API SHALL be accessible via a stable URL (e.g., api.dayflow.com or *.render.com subdomain)
8. THE Deployment_Platform SHALL support Environment_Variables configuration for DATABASE_URL, JWT_SECRET, FRONTEND_ORIGIN, GEMINI_API_KEY, and GROQ_API_KEY

### Requirement 2: Frontend Application Hosting

**User Story:** As a system administrator, I want to deploy the Frontend Service to a Next.js-optimized platform, so that users experience fast page loads and global CDN distribution.

#### Acceptance Criteria

1. THE Frontend_Service SHALL be deployed to a Next.js-compatible Deployment_Platform with automatic static optimization
2. WHEN the Frontend_Service builds, THE Deployment_Platform SHALL execute npm run build
3. THE Frontend_Service SHALL be accessible over HTTPS with a valid SSL_Certificate
4. THE Frontend_Service SHALL use NEXT_PUBLIC_API_URL environment variable to connect to the Backend_API
5. THE Frontend_Service SHALL be served through a global CDN for reduced latency
6. THE Deployment_Platform SHALL support automatic deployments from git branch updates
7. THE Frontend_Service SHALL display a custom 404 page for invalid routes
8. THE Frontend_Service SHALL be accessible via a Custom_Domain or platform subdomain

### Requirement 3: Database Service Provisioning

**User Story:** As a system administrator, I want to provision a PostgreSQL database in the cloud, so that application data is persisted reliably with automated backups.

#### Acceptance Criteria

1. THE Database_Service SHALL run PostgreSQL version 16 or higher
2. THE Database_Service SHALL be accessible only from the Backend_API IP addresses (network isolation)
3. THE Database_Service SHALL provide a DATABASE_URL connection string in postgresql:// format
4. THE Database_Service SHALL support SSL/TLS encrypted connections
5. THE Database_Service SHALL allocate at least 1GB of storage with auto-scaling capability
6. THE Database_Service SHALL be hosted in the same geographic region as the Backend_API for low latency
7. WHEN the Backend_API connects to the Database_Service, THE connection SHALL succeed within 5 seconds
8. THE Database_Service SHALL enforce the database schema defined in /backend/prisma/schema.prisma

### Requirement 4: Database Migration Management

**User Story:** As a developer, I want to apply database migrations safely in production, so that schema changes are deployed without data loss or downtime.

#### Acceptance Criteria

1. WHEN the Backend_API is deployed, THE Deployment_Platform SHALL execute Database_Deploy command before starting the server
2. IF Database_Deploy fails, THEN THE Deployment_Platform SHALL prevent the Backend_API from starting
3. THE Database_Migration process SHALL apply migrations from /backend/prisma/migrations directory
4. THE Database_Service SHALL record applied migrations in the _prisma_migrations table
5. WHEN a migration is applied, THE Database_Service SHALL execute it within a transaction to prevent partial updates
6. THE Database_Deploy command SHALL not generate new migrations (only apply existing ones)
7. IF the database schema is out of sync, THEN THE Database_Deploy command SHALL return a clear error message

### Requirement 5: Environment Configuration Management

**User Story:** As a developer, I want to securely configure environment variables for production, so that sensitive credentials are protected and the application runs correctly.

#### Acceptance Criteria

1. THE Backend_API SHALL require Environment_Variables for DATABASE_URL, JWT_SECRET, PORT, FRONTEND_ORIGIN, GEMINI_API_KEY, and GROQ_API_KEY
2. THE Frontend_Service SHALL require Environment_Variables for NEXT_PUBLIC_API_URL
3. THE JWT_SECRET SHALL be a cryptographically random string of at least 32 characters
4. THE Deployment_Platform SHALL encrypt Environment_Variables at rest
5. THE Environment_Variables SHALL not be committed to version control (excluded in .gitignore)
6. WHEN a required Environment_Variable is missing, THE Shiftly_System SHALL fail to start with a descriptive error
7. THE FRONTEND_ORIGIN SHALL match the Frontend_Service URL for CORS validation
8. THE NEXT_PUBLIC_API_URL SHALL point to the Backend_API URL
9. WHERE AI chat features are enabled, THE Backend_API SHALL validate GEMINI_API_KEY and GROQ_API_KEY are set

### Requirement 6: CORS and API Security

**User Story:** As a security administrator, I want to configure CORS policies correctly, so that only the legitimate frontend can access the backend API.

#### Acceptance Criteria

1. THE Backend_API SHALL enforce a CORS_Policy that allows requests only from FRONTEND_ORIGIN
2. WHEN a request originates from a different origin, THE Backend_API SHALL return HTTP 403 Forbidden
3. THE Backend_API SHALL include CORS headers in all API responses (Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers)
4. THE Backend_API SHALL allow credentials in CORS requests (Access-Control-Allow-Credentials: true)
5. THE CORS_Policy SHALL permit HTTP methods: GET, POST, PUT, DELETE, OPTIONS
6. THE CORS_Policy SHALL permit headers: Content-Type, Authorization
7. THE Backend_API SHALL respond to OPTIONS preflight requests with 200 OK and appropriate CORS headers

### Requirement 7: Custom Domain and SSL Configuration

**User Story:** As a system administrator, I want to configure custom domains with SSL certificates, so that users access the application via professional branded URLs over secure connections.

#### Acceptance Criteria

1. WHERE a Custom_Domain is configured, THE Frontend_Service SHALL be accessible via the Custom_Domain (e.g., hrms.company.com)
2. WHERE a Custom_Domain is configured, THE Backend_API SHALL be accessible via an API subdomain (e.g., api.company.com)
3. THE Deployment_Platform SHALL automatically provision and renew SSL_Certificate for all domains
4. WHEN a user accesses the application over HTTP, THE Deployment_Platform SHALL redirect to HTTPS
5. THE SSL_Certificate SHALL be valid for at least 90 days before expiration
6. THE SSL_Certificate SHALL use TLS 1.2 or higher
7. THE Custom_Domain DNS records SHALL be configured with A or CNAME records pointing to the Deployment_Platform

### Requirement 8: Automated Deployment (CI/CD)

**User Story:** As a developer, I want automated deployments from git commits, so that new features and bug fixes reach production quickly and reliably.

#### Acceptance Criteria

1. WHEN a commit is pushed to the production git branch, THE Deployment_Platform SHALL automatically trigger a deployment
2. THE CI_CD_Pipeline SHALL execute build steps in this order: npm install, prisma generate, npm run build (frontend) or npm start (backend)
3. IF the build fails, THEN THE Deployment_Platform SHALL not deploy the broken version and SHALL notify the team
4. WHEN a deployment succeeds, THE Deployment_Platform SHALL route traffic to the new version within 2 minutes
5. THE Deployment_Platform SHALL maintain the previous version for rollback capability
6. WHEN a deployment fails, THE Deployment_Platform SHALL automatically rollback to the previous working version
7. THE CI_CD_Pipeline SHALL display build logs in the deployment dashboard for debugging

### Requirement 9: Database Backup and Recovery

**User Story:** As a system administrator, I want automated database backups, so that employee data can be recovered in case of accidental deletion or system failure.

#### Acceptance Criteria

1. THE Backup_Service SHALL create automated backups of the Database_Service every 24 hours
2. THE Backup_Service SHALL retain daily backups for at least 7 days
3. THE Backup_Service SHALL store backups in a geographically separate location from the Database_Service
4. THE Backup_Service SHALL encrypt backups at rest using AES-256 encryption
5. WHEN a backup is created, THE Backup_Service SHALL verify backup integrity before marking it successful
6. THE Backup_Service SHALL provide a restore mechanism with a recovery time objective (RTO) of less than 4 hours
7. THE system administrator SHALL be able to manually trigger an on-demand backup
8. WHEN a backup fails, THE Backup_Service SHALL alert the system administrator via email or notification

### Requirement 10: Application Monitoring and Logging

**User Story:** As a developer, I want centralized logging and error monitoring, so that I can diagnose production issues quickly and track application performance.

#### Acceptance Criteria

1. THE Backend_API SHALL log all HTTP requests with timestamp, method, path, status code, and response time
2. THE Backend_API SHALL log all errors with stack traces to the Monitoring_Service
3. WHEN an unhandled exception occurs, THE Backend_API SHALL log the error and return HTTP 500 Internal Server Error
4. THE Monitoring_Service SHALL aggregate logs from all Backend_API instances
5. THE Monitoring_Service SHALL support log search and filtering by timestamp, severity, and endpoint
6. THE Monitoring_Service SHALL track application metrics: request rate, error rate, response time (p50, p95, p99)
7. WHEN error rate exceeds 5% of total requests, THE Monitoring_Service SHALL send an alert notification
8. THE Log_Aggregation system SHALL retain logs for at least 30 days
9. THE Frontend_Service SHALL log JavaScript errors to the Monitoring_Service for client-side debugging

### Requirement 11: Performance and Scaling

**User Story:** As a system administrator, I want the application to scale automatically under load, so that performance remains consistent during peak usage times.

#### Acceptance Criteria

1. THE Backend_API SHALL handle at least 100 concurrent requests without performance degradation
2. WHEN response time exceeds 2 seconds, THE Deployment_Platform SHALL scale up additional Backend_API instances
3. THE Frontend_Service SHALL serve static assets with cache headers (max-age=31536000 for immutable assets)
4. THE Database_Service SHALL support connection pooling with a maximum of 10 concurrent connections per Backend_API instance
5. THE Backend_API SHALL implement Rate_Limiting of 100 requests per minute per IP address
6. WHEN Rate_Limiting threshold is exceeded, THE Backend_API SHALL return HTTP 429 Too Many Requests
7. THE Frontend_Service SHALL implement code splitting to reduce initial page load size to under 500KB

### Requirement 12: Health Checks and Uptime Monitoring

**User Story:** As a system administrator, I want automated health checks, so that I am notified immediately if the application becomes unavailable.

#### Acceptance Criteria

1. THE Deployment_Platform SHALL ping the Health_Check endpoint every 60 seconds
2. WHEN the Health_Check endpoint returns HTTP 200 OK, THE Deployment_Platform SHALL consider the Backend_API healthy
3. IF the Health_Check fails 3 consecutive times, THEN THE Deployment_Platform SHALL mark the Backend_API as unhealthy and restart it
4. THE Health_Check endpoint SHALL verify database connectivity before returning success
5. THE Monitoring_Service SHALL track uptime percentage and display it in a dashboard
6. WHEN uptime falls below 99.5% in a 24-hour period, THE Monitoring_Service SHALL send an alert notification
7. THE Monitoring_Service SHALL provide a public status page showing current system health

### Requirement 13: Deployment Cost Optimization

**User Story:** As a business owner, I want cost-effective deployment options, so that infrastructure costs remain predictable and within budget for an SME application.

#### Acceptance Criteria

1. THE Production_Environment deployment cost SHALL not exceed $50 per month for 50 concurrent users
2. THE Deployment_Platform SHALL provide a free tier or low-cost starter plan for Staging_Environment
3. THE Database_Service SHALL offer pay-per-use pricing or include free backup storage up to 10GB
4. THE Frontend_Service SHALL utilize free CDN and static hosting where available (e.g., Vercel free tier)
5. WHERE AI features are optional, THE system administrator SHALL be able to disable them to save API costs
6. THE Backend_API SHALL run on a single instance initially with ability to scale horizontally when needed
7. THE Monitoring_Service SHALL offer a free tier with at least 30-day log retention

### Requirement 14: Staging Environment Setup

**User Story:** As a developer, I want a staging environment identical to production, so that I can test changes safely before deploying to production.

#### Acceptance Criteria

1. THE Shiftly_System SHALL have a separate Staging_Environment with its own Frontend_Service, Backend_API, and Database_Service
2. THE Staging_Environment SHALL use the same Deployment_Platform and configuration as Production_Environment
3. THE Staging_Environment SHALL be accessible via staging-specific URLs (e.g., staging.hrms.company.com)
4. THE Staging_Environment Database_Service SHALL contain test data, not production data
5. THE CI_CD_Pipeline SHALL automatically deploy to Staging_Environment on commits to the staging git branch
6. THE developer SHALL be able to manually promote a Staging_Environment deployment to Production_Environment
7. THE Staging_Environment SHALL use separate Environment_Variables from Production_Environment
8. THE Staging_Environment SHALL not send real email notifications or external API calls (use mock services)

### Requirement 15: Security Hardening

**User Story:** As a security administrator, I want the application to follow security best practices, so that sensitive employee data is protected from unauthorized access and attacks.

#### Acceptance Criteria

1. THE Backend_API SHALL enforce HTTPS-only connections (reject HTTP requests)
2. THE Backend_API SHALL set security headers: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, X-XSS-Protection: 1; mode=block
3. THE Backend_API SHALL validate and sanitize all user input to prevent SQL injection attacks
4. THE JWT_SECRET SHALL be rotated every 90 days with a documented rotation process
5. THE Database_Service SHALL enforce encrypted connections using SSL/TLS
6. THE Database_Service SHALL use strong authentication (no default passwords)
7. THE Backend_API SHALL implement request size limits (max 10MB per request) to prevent denial-of-service attacks
8. THE Backend_API SHALL log all authentication attempts (successful and failed) for audit trails
9. THE Frontend_Service SHALL implement Content Security Policy (CSP) headers to prevent XSS attacks
10. THE Environment_Variables SHALL be accessible only to authorized deployment administrators

### Requirement 16: Documentation and Runbooks

**User Story:** As a system administrator, I want comprehensive deployment documentation, so that I can deploy, maintain, and troubleshoot the application without developer assistance.

#### Acceptance Criteria

1. THE deployment documentation SHALL include step-by-step instructions for initial production setup
2. THE deployment documentation SHALL list all required Environment_Variables with example values (sanitized)
3. THE deployment documentation SHALL include a rollback procedure for failed deployments
4. THE deployment documentation SHALL include a disaster recovery procedure for database restoration
5. THE deployment documentation SHALL document how to configure Custom_Domain DNS records
6. THE deployment documentation SHALL include troubleshooting guides for common deployment issues
7. THE deployment documentation SHALL specify the monitoring dashboard URL and access credentials
8. THE deployment documentation SHALL include contact information for deployment platform support

## Recommended Deployment Architecture

Based on existing configuration and cost-effectiveness for SME HRMS:

### Backend API
- **Platform**: Render.com (existing render.yaml configuration)
- **Service Type**: Web Service (Node.js)
- **Instance**: Starter plan ($7/month) - sufficient for 50-100 concurrent users
- **Region**: US West (Oregon) or closest to target users

### Frontend
- **Platform**: Vercel (existing .vercel configuration)
- **Plan**: Free tier (supports commercial projects, 100GB bandwidth)
- **Deployment**: Automatic from git push
- **CDN**: Global edge network included

### Database
- **Platform**: Render PostgreSQL (integrates seamlessly with backend)
- **Plan**: Starter plan ($7/month) - 1GB storage with daily backups
- **Alternative**: Supabase free tier (500MB) or Neon serverless PostgreSQL

### Monitoring
- **Platform**: Render built-in logs + optional Sentry free tier for error tracking
- **Logs**: 7-day retention on Render starter plan

### Total Estimated Cost
- Render backend: $7/month
- Render PostgreSQL: $7/month
- Vercel frontend: $0/month (free tier)
- **Total: ~$14/month** (well under $50 requirement)

### Alternatives for Lower Cost
- **Railway.app**: $5/month combined backend + PostgreSQL
- **Fly.io**: Pay-per-use with generous free tier
- **Supabase**: Free PostgreSQL + hosting (500MB storage, 2GB bandwidth)
