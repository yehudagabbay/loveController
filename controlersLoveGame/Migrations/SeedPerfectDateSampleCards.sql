SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF OBJECT_ID(N'dbo.PerfectDateCardTranslations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PerfectDateCardTranslations
    (
        PerfectDateCardTranslationID int IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_PerfectDateCardTranslations PRIMARY KEY,
        PerfectDateCardID int NOT NULL,
        LanguageCode nvarchar(10) NOT NULL,
        User1BackLabel nvarchar(80) NULL,
        User1Label nvarchar(80) NULL,
        User1Text nvarchar(max) NULL,
        User2BackLabel nvarchar(80) NULL,
        User2Label nvarchar(80) NULL,
        User2Text nvarchar(max) NULL,
        CreatedAt datetime2 NOT NULL CONSTRAINT DF_PerfectDateCardTranslations_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt datetime2 NULL,
        CONSTRAINT FK_PerfectDateCardTranslations_PerfectDateCards
            FOREIGN KEY (PerfectDateCardID)
            REFERENCES dbo.PerfectDateCards(PerfectDateCardID)
            ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IX_PerfectDateCardTranslations_PerfectDateCardID_LanguageCode
        ON dbo.PerfectDateCardTranslations(PerfectDateCardID, LanguageCode);
END;

DECLARE @MainCards table
(
    CardCode nvarchar(80) NOT NULL,
    TaskType nvarchar(30) NOT NULL,
    AudienceMode nvarchar(30) NOT NULL,
    Location nvarchar(20) NULL,
    Vibe nvarchar(30) NULL,
    Goal nvarchar(50) NULL,
    BoundaryKey nvarchar(80) NULL,
    SortOrder int NOT NULL,
    User1BackLabel nvarchar(80) NULL,
    User1Label nvarchar(80) NULL,
    User1Text nvarchar(max) NULL,
    IsUser1Secret bit NOT NULL,
    User2BackLabel nvarchar(80) NULL,
    User2Label nvarchar(80) NULL,
    User2Text nvarchar(max) NULL,
    IsUser2Secret bit NOT NULL
);

DECLARE @Translations table
(
    CardCode nvarchar(80) NOT NULL,
    LanguageCode nvarchar(10) NOT NULL,
    User1BackLabel nvarchar(80) NULL,
    User1Label nvarchar(80) NULL,
    User1Text nvarchar(max) NULL,
    User2BackLabel nvarchar(80) NULL,
    User2Label nvarchar(80) NULL,
    User2Text nvarchar(max) NULL
);

INSERT INTO @MainCards
(
    CardCode,
    TaskType,
    AudienceMode,
    Location,
    Vibe,
    Goal,
    BoundaryKey,
    SortOrder,
    User1BackLabel,
    User1Label,
    User1Text,
    IsUser1Secret,
    User2BackLabel,
    User2Label,
    User2Text,
    IsUser2Secret
)
VALUES
(
    N'PD_REAL_QUESTION_001',
    N'question',
    N'both',
    NULL,
    N'deep',
    N'intimacy',
    NULL,
    10,
    N'שאלה משותפת',
    N'שיחה מקרבת',
    N'כל אחד בתורו משלים את המשפט: "הרגשתי קרוב/ה אליך לאחרונה כש...". אחרי התשובה הצד השני חוזר בקצרה על מה ששמע לפני שהוא עונה.',
    0,
    N'שאלה משותפת',
    N'שיחה מקרבת',
    N'כל אחד בתורו משלים את המשפט: "הרגשתי קרוב/ה אליך לאחרונה כש...". אחרי התשובה הצד השני חוזר בקצרה על מה ששמע לפני שהוא עונה.',
    0
),
(
    N'PD_REAL_SHARED_TASK_001',
    N'shared_task',
    N'both',
    NULL,
    N'light',
    N'appreciation',
    NULL,
    20,
    N'משימה זוגית',
    N'רגע של פרגון',
    N'בחרו חפץ אחד שנמצא לידכם. כל אחד מספר למה החפץ הזה מזכיר לו משהו טוב בצד השני. תשאירו את זה קליל, מדויק וללא הסברים ארוכים.',
    0,
    N'משימה זוגית',
    N'רגע של פרגון',
    N'בחרו חפץ אחד שנמצא לידכם. כל אחד מספר למה החפץ הזה מזכיר לו משהו טוב בצד השני. תשאירו את זה קליל, מדויק וללא הסברים ארוכים.',
    0
),
(
    N'PD_REAL_SECRET_TASK_001',
    N'secret_task',
    N'split',
    NULL,
    N'deep',
    N'intimacy',
    NULL,
    30,
    N'משימה סודית',
    N'סודי - לקרוא בלב',
    N'בדקה הקרובה אל תמהר/י להגיב. הסתכל/י על הצד השני כאילו זו הפעם הראשונה הערב, ואז אמור/אמרי משפט אחד אמיתי שמתחיל ב: "אני רואה אותך כש...".',
    1,
    N'משימה סודית',
    N'סודי - לקרוא בלב',
    N'בדקה הקרובה תן/י לצד השני להוביל. במקום להסביר או לתקן, שאל/י שאלה אחת עדינה שמתחילה ב: "מה היה חשוב לך בזה?".',
    1
);

INSERT INTO @Translations
(
    CardCode,
    LanguageCode,
    User1BackLabel,
    User1Label,
    User1Text,
    User2BackLabel,
    User2Label,
    User2Text
)
VALUES
(
    N'PD_REAL_QUESTION_001',
    N'en',
    N'Shared question',
    N'Closer conversation',
    N'Take turns completing this sentence: "I felt close to you recently when...". After each answer, the other partner briefly reflects what they heard before answering.',
    N'Shared question',
    N'Closer conversation',
    N'Take turns completing this sentence: "I felt close to you recently when...". After each answer, the other partner briefly reflects what they heard before answering.'
),
(
    N'PD_REAL_SHARED_TASK_001',
    N'en',
    N'Couple task',
    N'Appreciation moment',
    N'Choose one object near you. Each partner shares why that object reminds them of something good in the other person. Keep it light, specific, and short.',
    N'Couple task',
    N'Appreciation moment',
    N'Choose one object near you. Each partner shares why that object reminds them of something good in the other person. Keep it light, specific, and short.'
),
(
    N'PD_REAL_SECRET_TASK_001',
    N'en',
    N'Secret task',
    N'Secret - read silently',
    N'For the next minute, do not rush to respond. Look at your partner as if this is the first time tonight, then say one honest sentence that starts with: "I see you when...".',
    N'Secret task',
    N'Secret - read silently',
    N'For the next minute, let your partner lead. Instead of explaining or correcting, ask one gentle question that starts with: "What mattered to you about that?".'
);

UPDATE target
SET
    target.LanguageCode = N'he',
    target.TaskType = seed.TaskType,
    target.AudienceMode = seed.AudienceMode,
    target.Location = seed.Location,
    target.Vibe = seed.Vibe,
    target.Goal = seed.Goal,
    target.BoundaryKey = seed.BoundaryKey,
    target.SortOrder = seed.SortOrder,
    target.User1BackLabel = seed.User1BackLabel,
    target.User1Label = seed.User1Label,
    target.User1Text = seed.User1Text,
    target.IsUser1Secret = seed.IsUser1Secret,
    target.User2BackLabel = seed.User2BackLabel,
    target.User2Label = seed.User2Label,
    target.User2Text = seed.User2Text,
    target.IsUser2Secret = seed.IsUser2Secret,
    target.IsActive = 1,
    target.UpdatedAt = SYSUTCDATETIME()
FROM dbo.PerfectDateCards target
JOIN @MainCards seed
    ON seed.CardCode = target.CardCode
WHERE target.LanguageCode = N'he';

INSERT INTO dbo.PerfectDateCards
(
    CardCode,
    LanguageCode,
    TaskType,
    AudienceMode,
    Location,
    Vibe,
    Goal,
    BoundaryKey,
    SortOrder,
    User1BackLabel,
    User1Label,
    User1Text,
    IsUser1Secret,
    User2BackLabel,
    User2Label,
    User2Text,
    IsUser2Secret,
    IsActive,
    CreatedAt
)
SELECT
    seed.CardCode,
    N'he',
    seed.TaskType,
    seed.AudienceMode,
    seed.Location,
    seed.Vibe,
    seed.Goal,
    seed.BoundaryKey,
    seed.SortOrder,
    seed.User1BackLabel,
    seed.User1Label,
    seed.User1Text,
    seed.IsUser1Secret,
    seed.User2BackLabel,
    seed.User2Label,
    seed.User2Text,
    seed.IsUser2Secret,
    1,
    SYSUTCDATETIME()
FROM @MainCards seed
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.PerfectDateCards existing
    WHERE existing.CardCode = seed.CardCode
      AND existing.LanguageCode = N'he'
);

UPDATE task
SET task.PerfectDateCardID = hebrew.PerfectDateCardID
FROM dbo.PerfectDateTasks task
JOIN dbo.PerfectDateCards currentCard
    ON currentCard.PerfectDateCardID = task.PerfectDateCardID
JOIN dbo.PerfectDateCards hebrew
    ON hebrew.CardCode = currentCard.CardCode
   AND hebrew.LanguageCode = N'he'
WHERE currentCard.LanguageCode <> N'he';

UPDATE task
SET
    task.TaskType = card.TaskType,
    task.AudienceMode = card.AudienceMode,
    task.User1BackLabel = card.User1BackLabel,
    task.User1Label = card.User1Label,
    task.User1Text = card.User1Text,
    task.IsUser1Secret = card.IsUser1Secret,
    task.User2BackLabel = card.User2BackLabel,
    task.User2Label = card.User2Label,
    task.User2Text = card.User2Text,
    task.IsUser2Secret = card.IsUser2Secret
FROM dbo.PerfectDateTasks task
JOIN dbo.PerfectDateCards card
    ON card.PerfectDateCardID = task.PerfectDateCardID
JOIN @MainCards seed
    ON seed.CardCode = card.CardCode
WHERE card.LanguageCode = N'he';

UPDATE target
SET
    target.User1BackLabel = translation.User1BackLabel,
    target.User1Label = translation.User1Label,
    target.User1Text = translation.User1Text,
    target.User2BackLabel = translation.User2BackLabel,
    target.User2Label = translation.User2Label,
    target.User2Text = translation.User2Text,
    target.UpdatedAt = SYSUTCDATETIME()
FROM dbo.PerfectDateCardTranslations target
JOIN dbo.PerfectDateCards card
    ON card.PerfectDateCardID = target.PerfectDateCardID
JOIN @Translations translation
    ON translation.CardCode = card.CardCode
   AND translation.LanguageCode = target.LanguageCode
WHERE card.LanguageCode = N'he';

INSERT INTO dbo.PerfectDateCardTranslations
(
    PerfectDateCardID,
    LanguageCode,
    User1BackLabel,
    User1Label,
    User1Text,
    User2BackLabel,
    User2Label,
    User2Text,
    CreatedAt
)
SELECT
    card.PerfectDateCardID,
    translation.LanguageCode,
    translation.User1BackLabel,
    translation.User1Label,
    translation.User1Text,
    translation.User2BackLabel,
    translation.User2Label,
    translation.User2Text,
    SYSUTCDATETIME()
FROM @Translations translation
JOIN dbo.PerfectDateCards card
    ON card.CardCode = translation.CardCode
   AND card.LanguageCode = N'he'
WHERE NOT EXISTS
(
    SELECT 1
    FROM dbo.PerfectDateCardTranslations existing
    WHERE existing.PerfectDateCardID = card.PerfectDateCardID
      AND existing.LanguageCode = translation.LanguageCode
);

DELETE duplicate
FROM dbo.PerfectDateCards duplicate
JOIN @MainCards seed
    ON seed.CardCode = duplicate.CardCode
WHERE duplicate.LanguageCode <> N'he';

COMMIT TRANSACTION;
