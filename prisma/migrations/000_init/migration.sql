-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "age" INTEGER,
    "goal" TEXT,
    "activityLevel" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'ru',
    "calorieGoal" DOUBLE PRECISION,
    "proteinGoal" DOUBLE PRECISION,
    "fatGoal" DOUBLE PRECISION,
    "carbGoal" DOUBLE PRECISION,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "subscriptionStart" TIMESTAMP(3),
    "subscriptionEnd" TIMESTAMP(3),
    "subscriptionGivenBy" TEXT,
    "aiPlansThisMonth" INTEGER NOT NULL DEFAULT 0,
    "aiPlansResetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "createdById" TEXT NOT NULL,
    "usedById" TEXT,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL,
    "exercises" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "exercises" TEXT NOT NULL,
    "duration" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "workoutId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCode_code_key" ON "SubscriptionCode"("code");

-- CreateIndex
CREATE INDEX "SubscriptionCode_code_idx" ON "SubscriptionCode"("code");

-- CreateIndex
CREATE INDEX "SubscriptionCode_createdById_idx" ON "SubscriptionCode"("createdById");

-- CreateIndex
CREATE INDEX "SubscriptionCode_usedById_idx" ON "SubscriptionCode"("usedById");

-- CreateIndex
CREATE INDEX "SubscriptionCode_isActive_idx" ON "SubscriptionCode"("isActive");

-- CreateIndex
CREATE INDEX "Workout_userId_date_idx" ON "Workout"("userId", "date");

-- CreateIndex
CREATE INDEX "AIPlan_userId_idx" ON "AIPlan"("userId");

-- CreateIndex
CREATE INDEX "WorkoutPlan_userId_date_idx" ON "WorkoutPlan"("userId", "date");

-- CreateIndex
CREATE INDEX "WorkoutPlan_userId_completed_idx" ON "WorkoutPlan"("userId", "completed");

-- AddForeignKey
ALTER TABLE "SubscriptionCode" ADD CONSTRAINT "SubscriptionCode_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionCode" ADD CONSTRAINT "SubscriptionCode_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIPlan" ADD CONSTRAINT "AIPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutPlan" ADD CONSTRAINT "WorkoutPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

