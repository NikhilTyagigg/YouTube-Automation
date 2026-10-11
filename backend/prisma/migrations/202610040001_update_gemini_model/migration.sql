ALTER TABLE "settings" ALTER COLUMN "geminiModel" SET DEFAULT 'gemini-3.8-flash';
UPDATE "settings" SET "geminiModel" = 'gemini-3.8-flash' WHERE "geminiModel" = 'gemini-2.0-flash';
