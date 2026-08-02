-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deployedLanes" TEXT NOT NULL,
    "deploymentType" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT,
    "lastDeployed" DATETIME,
    "health" TEXT,
    "plannedExecutionTime" DATETIME
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "servers" TEXT NOT NULL,
    CONSTRAINT "Deployment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lane" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "edgeStatus" TEXT NOT NULL,
    "enterpriseStatus" TEXT NOT NULL,
    "edgeLoadBalancer" TEXT NOT NULL,
    "enterpriseLoadBalancer" TEXT NOT NULL,
    "edgeCircuitBreaker" TEXT NOT NULL,
    "enterpriseCircuitBreaker" TEXT NOT NULL,
    "trafficDistribution" INTEGER NOT NULL,
    "healthStatus" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requester" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comments" TEXT,
    "data" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "requiresApproval" BOOLEAN NOT NULL,
    "approverRole" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ChangeWindow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Log" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "level" TEXT,
    "component" TEXT,
    "action" TEXT,
    "user" TEXT,
    "message" TEXT,
    "details" TEXT,
    "status" TEXT,
    "lane" TEXT
);

-- CreateTable
CREATE TABLE "GlobalSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "dnsServer" TEXT NOT NULL,
    "ntpServer" TEXT NOT NULL,
    "syslogServer" TEXT NOT NULL,
    "healthCheckInterval" INTEGER NOT NULL,
    "circuitBreakerThreshold" INTEGER NOT NULL,
    "autoFailoverEnabled" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "AlertConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL,
    "channels" TEXT NOT NULL,
    "rules" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "maintenanceMode" BOOLEAN NOT NULL,
    "maintenanceMessage" TEXT NOT NULL,
    "systemName" TEXT NOT NULL,
    "dataRetentionDays" INTEGER NOT NULL,
    "theme" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowRule_actionType_key" ON "WorkflowRule"("actionType");
