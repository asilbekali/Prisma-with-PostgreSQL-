/*
  Warnings:

  - A unique constraint covering the columns `[user_id,ip]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Session_user_id_ip_key" ON "Session"("user_id", "ip");
