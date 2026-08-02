-- CreateTable
CREATE TABLE "SWGConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "proxyIp" TEXT NOT NULL DEFAULT '10.1.10.51',
    "proxyPort" INTEGER NOT NULL DEFAULT 8080,
    "proxyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "vlans" TEXT NOT NULL DEFAULT '["vlan30","vlan40"]',
    "sslIntercept" BOOLEAN NOT NULL DEFAULT true,
    "caCert" TEXT,
    "bypassList" TEXT NOT NULL DEFAULT '[]',
    "authEnabled" BOOLEAN NOT NULL DEFAULT true,
    "authScheme" TEXT NOT NULL DEFAULT 'ntlm',
    "authRealm" TEXT NOT NULL DEFAULT 'CORP.LOCAL',
    "ldapConfig" TEXT,
    "logEnabled" BOOLEAN NOT NULL DEFAULT true,
    "logLevel" TEXT NOT NULL DEFAULT 'info',
    "logDest" TEXT NOT NULL DEFAULT 'local',
    "siemEnabled" BOOLEAN NOT NULL DEFAULT false,
    "siemServerIp" TEXT,
    "siemPort" INTEGER NOT NULL DEFAULT 514,
    "siemProtocol" TEXT NOT NULL DEFAULT 'udp',
    "siemFormat" TEXT NOT NULL DEFAULT 'cef',
    "icapEnabled" BOOLEAN NOT NULL DEFAULT false,
    "icapServerUri" TEXT,
    "icapPreview" INTEGER NOT NULL DEFAULT 1024,
    "icapFailOpen" BOOLEAN NOT NULL DEFAULT true,
    "blockPageTemplate" TEXT NOT NULL DEFAULT '<h1>Access Denied</h1>',
    "blockPageEmail" TEXT NOT NULL DEFAULT 'security@bank.com',
    "showCategory" BOOLEAN NOT NULL DEFAULT true,
    "showIP" BOOLEAN NOT NULL DEFAULT true,
    "threatFeedsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "threatFeedsInterval" TEXT NOT NULL DEFAULT 'daily',
    "threatFeedsLicenseKey" TEXT,
    "threatFeedsLastUpdate" DATETIME,
    "threatFeedsStatus" TEXT NOT NULL DEFAULT 'active',
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SWGBlockedUrl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT 'dg-blocked-urls',
    "addedBy" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SWGCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'allowed',
    "count" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "SWGPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layer" TEXT NOT NULL DEFAULT 'layer3',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SWGPolicyRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditionType" TEXT NOT NULL,
    "conditionOperator" TEXT NOT NULL,
    "conditionValue" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'allow',
    "logEnabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "SWGPolicyRule_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "SWGPolicy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SWGSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "clientIp" TEXT NOT NULL,
    "vsName" TEXT,
    "startTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeen" DATETIME NOT NULL,
    "traffic" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active'
);

-- CreateTable
CREATE TABLE "SWGAccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientIp" TEXT NOT NULL,
    "user" TEXT,
    "method" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "rule" TEXT,
    "category" TEXT,
    "bytesIn" INTEGER NOT NULL DEFAULT 0,
    "bytesOut" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "SWGBlockedUrl_group_idx" ON "SWGBlockedUrl"("group");

-- CreateIndex
CREATE UNIQUE INDEX "SWGBlockedUrl_url_group_key" ON "SWGBlockedUrl"("url", "group");

-- CreateIndex
CREATE UNIQUE INDEX "SWGCategory_name_key" ON "SWGCategory"("name");

-- CreateIndex
CREATE INDEX "SWGPolicyRule_policyId_idx" ON "SWGPolicyRule"("policyId");

-- CreateIndex
CREATE INDEX "SWGPolicyRule_priority_idx" ON "SWGPolicyRule"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "SWGSession_sessionId_key" ON "SWGSession"("sessionId");

-- CreateIndex
CREATE INDEX "SWGAccessLog_timestamp_idx" ON "SWGAccessLog"("timestamp");

-- CreateIndex
CREATE INDEX "SWGAccessLog_clientIp_idx" ON "SWGAccessLog"("clientIp");

-- CreateIndex
CREATE INDEX "SWGAccessLog_action_idx" ON "SWGAccessLog"("action");
