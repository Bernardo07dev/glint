-- CreateTable
CREATE TABLE "UserAnimation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstAccess" TEXT,
    "waitingFrontTap" TEXT,
    "homeSplashReady" TEXT,
    "homeSplashStreak" TEXT,
    "homeSplashReturn" TEXT,
    "homeSplashRest" TEXT,
    "planCreation" TEXT,
    "plansHub" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAnimation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAnimation_userId_key" ON "UserAnimation"("userId");

-- AddForeignKey
ALTER TABLE "UserAnimation" ADD CONSTRAINT "UserAnimation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
