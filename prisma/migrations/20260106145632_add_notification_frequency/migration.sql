-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'VICE_LEADER', 'LEADER', 'FINANCE', 'ADMIN');

-- CreateEnum
CREATE TYPE "NotificationFrequency" AS ENUM ('INSTANT', 'DAILY_DIGEST', 'OFF');

-- CreateEnum
CREATE TYPE "TeamDepartment" AS ENUM ('ELECTRICAL', 'MECHANICAL', 'DOCUMENTATION', 'PR', 'FINANCE', 'DESIGN');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PENDING_MANAGER', 'PENDING_FINANCE', 'RETURNED', 'PAID', 'REJECTED');

-- CreateEnum
CREATE TYPE "ItemCategory" AS ENUM ('MOTOR', 'SENSOR', 'PNEUMATIC', 'CONTROLLER', 'HARDWARE', 'RAW_MATERIAL', 'TOOL');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE_IN', 'PROJECT_USE', 'DAMAGED', 'LOST', 'AUDIT_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "FundingType" AS ENUM ('SPONSORSHIP', 'DONATION', 'GRANT', 'FUNDRAISING', 'OTHER');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "department" "TeamDepartment",
    "notificationFrequency" "NotificationFrequency" NOT NULL DEFAULT 'INSTANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "department" "TeamDepartment" NOT NULL DEFAULT 'ELECTRICAL',
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amountCents" INTEGER NOT NULL,
    "submitterName" TEXT NOT NULL DEFAULT 'Unknown',
    "submitterEmail" TEXT NOT NULL DEFAULT '',
    "submitterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseItem" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "receiptUrl" TEXT,
    "reportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptAudit" (
    "id" TEXT NOT NULL,
    "expenseItemId" TEXT NOT NULL,
    "extractedAmount" INTEGER,
    "extractedDate" TIMESTAMP(3),
    "extractedVendor" TEXT,
    "invoiceNumber" TEXT,
    "rawText" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "matchScore" INTEGER NOT NULL DEFAULT 0,
    "issues" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalAction" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentBudget" (
    "id" TEXT NOT NULL,
    "department" "TeamDepartment" NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT NOT NULL,

    CONSTRAINT "DepartmentBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "category" "ItemCategory" NOT NULL,
    "storageLocation" TEXT NOT NULL,
    "currentQuantity" INTEGER NOT NULL DEFAULT 0,
    "safetyStockLevel" INTEGER NOT NULL DEFAULT 0,
    "vendorLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "changeAmount" INTEGER NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "relatedProjectId" TEXT,
    "performedBy" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FundingRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "FundingType" NOT NULL,
    "source" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FundingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ExpenseReport_submitterId_idx" ON "ExpenseReport"("submitterId");

-- CreateIndex
CREATE INDEX "ExpenseReport_submitterEmail_idx" ON "ExpenseReport"("submitterEmail");

-- CreateIndex
CREATE INDEX "ExpenseReport_status_idx" ON "ExpenseReport"("status");

-- CreateIndex
CREATE INDEX "ExpenseReport_department_idx" ON "ExpenseReport"("department");

-- CreateIndex
CREATE INDEX "ExpenseReport_createdAt_idx" ON "ExpenseReport"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "ExpenseReport_status_createdAt_idx" ON "ExpenseReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ExpenseItem_reportId_idx" ON "ExpenseItem"("reportId");

-- CreateIndex
CREATE INDEX "ExpenseItem_category_idx" ON "ExpenseItem"("category");

-- CreateIndex
CREATE INDEX "ExpenseItem_date_idx" ON "ExpenseItem"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptAudit_expenseItemId_key" ON "ReceiptAudit"("expenseItemId");

-- CreateIndex
CREATE INDEX "ReceiptAudit_invoiceNumber_idx" ON "ReceiptAudit"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentBudget_department_key" ON "DepartmentBudget"("department");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");

-- CreateIndex
CREATE INDEX "FundingRecord_date_idx" ON "FundingRecord"("date");

-- CreateIndex
CREATE INDEX "FundingRecord_type_idx" ON "FundingRecord"("type");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseReport" ADD CONSTRAINT "ExpenseReport_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ExpenseReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptAudit" ADD CONSTRAINT "ReceiptAudit_expenseItemId_fkey" FOREIGN KEY ("expenseItemId") REFERENCES "ExpenseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "ExpenseReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalAction" ADD CONSTRAINT "ApprovalAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
