using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace controlersLoveGame.Migrations
{
    public partial class SimplifyPerfectDateSchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RoomCode",
                table: "PerfectDates",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CreatorUserID",
                table: "PerfectDates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatorGender",
                table: "PerfectDates",
                type: "nchar(1)",
                maxLength: 1,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "JoinedUserID",
                table: "PerfectDates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JoinedGender",
                table: "PerfectDates",
                type: "nchar(1)",
                maxLength: 1,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "LocationType",
                table: "PerfectDates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ExactLocation",
                table: "PerfectDates",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "LimitNoWorkAndMoney",
                table: "PerfectDates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "LimitNoFutureTalk",
                table: "PerfectDates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "LimitNoHeavyPast",
                table: "PerfectDates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "LimitNoPhysical",
                table: "PerfectDates",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CardType",
                table: "Cards",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "AllowedLocation",
                table: "Cards",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsWorkAndMoney",
                table: "Cards",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsFutureTalk",
                table: "Cards",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsHeavyPast",
                table: "Cards",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsPhysical",
                table: "Cards",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ContentText",
                table: "CardTranslations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentMaleSecret",
                table: "CardTranslations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentFemaleSecret",
                table: "CardTranslations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE PerfectDates
SET
    RoomCode = CASE WHEN TRY_CONVERT(int, DateNumber) IS NULL THEN 0 ELSE TRY_CONVERT(int, DateNumber) END,
    CreatorUserID = User1ID,
    JoinedUserID = User2ID,
    CreatorGender = CASE
        WHEN User1Gender IN ('Male', N'זכר', N'גבר') THEN 'M'
        WHEN User1Gender IN ('Female', N'נקבה', N'אישה', N'אשה') THEN 'F'
        ELSE CreatorGender
    END,
    JoinedGender = CASE
        WHEN User2Gender IN ('Male', N'זכר', N'גבר') THEN 'M'
        WHEN User2Gender IN ('Female', N'נקבה', N'אישה', N'אשה') THEN 'F'
        ELSE JoinedGender
    END,
    LocationType = CASE WHEN Location IN ('out', 'outside', N'בחוץ') THEN 1 ELSE 0 END;

UPDATE CardTranslations
SET ContentText = COALESCE(ContentText, CardText);
");

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDates_RoomCode",
                table: "PerfectDates",
                column: "RoomCode");

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDates_CreatorUserID_JoinedUserID",
                table: "PerfectDates",
                columns: new[] { "CreatorUserID", "JoinedUserID" });

            migrationBuilder.CreateIndex(
                name: "IX_Cards_ModeID_CardType_AllowedLocation",
                table: "Cards",
                columns: new[] { "ModeID", "CardType", "AllowedLocation" });

            migrationBuilder.CreateIndex(
                name: "IX_CardTranslations_CardID_LanguageCode",
                table: "CardTranslations",
                columns: new[] { "CardID", "LanguageCode" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(name: "IX_PerfectDates_RoomCode", table: "PerfectDates");
            migrationBuilder.DropIndex(name: "IX_PerfectDates_CreatorUserID_JoinedUserID", table: "PerfectDates");
            migrationBuilder.DropIndex(name: "IX_Cards_ModeID_CardType_AllowedLocation", table: "Cards");
            migrationBuilder.DropIndex(name: "IX_CardTranslations_CardID_LanguageCode", table: "CardTranslations");

            migrationBuilder.DropColumn(name: "RoomCode", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "CreatorUserID", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "CreatorGender", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "JoinedUserID", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "JoinedGender", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "LocationType", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "ExactLocation", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "LimitNoWorkAndMoney", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "LimitNoFutureTalk", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "LimitNoHeavyPast", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "LimitNoPhysical", table: "PerfectDates");
            migrationBuilder.DropColumn(name: "CardType", table: "Cards");
            migrationBuilder.DropColumn(name: "AllowedLocation", table: "Cards");
            migrationBuilder.DropColumn(name: "IsWorkAndMoney", table: "Cards");
            migrationBuilder.DropColumn(name: "IsFutureTalk", table: "Cards");
            migrationBuilder.DropColumn(name: "IsHeavyPast", table: "Cards");
            migrationBuilder.DropColumn(name: "IsPhysical", table: "Cards");
            migrationBuilder.DropColumn(name: "ContentText", table: "CardTranslations");
            migrationBuilder.DropColumn(name: "ContentMaleSecret", table: "CardTranslations");
            migrationBuilder.DropColumn(name: "ContentFemaleSecret", table: "CardTranslations");
        }
    }
}
