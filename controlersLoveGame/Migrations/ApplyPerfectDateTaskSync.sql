IF COL_LENGTH('dbo.PerfectDateTasks', 'User1CompletedAt') IS NULL
BEGIN
    ALTER TABLE dbo.PerfectDateTasks
    ADD User1CompletedAt datetime2 NULL;
END;

IF COL_LENGTH('dbo.PerfectDateTasks', 'User2CompletedAt') IS NULL
BEGIN
    ALTER TABLE dbo.PerfectDateTasks
    ADD User2CompletedAt datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_PerfectDateTasks_PerfectDateID_User1CompletedAt_User2CompletedAt'
      AND object_id = OBJECT_ID('dbo.PerfectDateTasks')
)
BEGIN
    CREATE INDEX IX_PerfectDateTasks_PerfectDateID_User1CompletedAt_User2CompletedAt
    ON dbo.PerfectDateTasks (PerfectDateID, User1CompletedAt, User2CompletedAt);
END;
