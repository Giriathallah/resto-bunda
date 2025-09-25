/*
  Warnings:

  - You are about to alter the column `role` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(6))` to `Enum(EnumId(0))`.
  - The values [GOOGLE,GITHUB,FACEBOOK] on the enum `UserOAuthAccount_provider` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE `UserOAuthAccount` MODIFY `provider` ENUM('discord', 'github', 'google') NOT NULL;
