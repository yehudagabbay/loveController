SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF COL_LENGTH('dbo.PerfectDates', 'SelectedVibes') IS NULL
BEGIN
    ALTER TABLE dbo.PerfectDates
        ADD SelectedVibes nvarchar(100) NOT NULL
            CONSTRAINT DF_PerfectDates_SelectedVibes DEFAULT N'';
END;
ELSE
BEGIN
    UPDATE dbo.PerfectDates
    SET SelectedVibes = N''
    WHERE SelectedVibes IS NULL;
END;

IF COL_LENGTH('dbo.PerfectDates', 'SelectedGoals') IS NULL
BEGIN
    ALTER TABLE dbo.PerfectDates
        ADD SelectedGoals nvarchar(120) NOT NULL
            CONSTRAINT DF_PerfectDates_SelectedGoals DEFAULT N'';
END;
ELSE
BEGIN
    UPDATE dbo.PerfectDates
    SET SelectedGoals = N''
    WHERE SelectedGoals IS NULL;
END;

COMMIT TRANSACTION;
