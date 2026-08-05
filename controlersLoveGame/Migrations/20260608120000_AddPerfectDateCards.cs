using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace controlersLoveGame.Migrations
{
    public partial class AddPerfectDateCards : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PerfectDateCards",
                columns: table => new
                {
                    PerfectDateCardID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CardCode = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false, defaultValue: "he"),
                    TaskType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AudienceMode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Location = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Vibe = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Goal = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BoundaryKey = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    User1BackLabel = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    User1Label = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    User1Text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsUser1Secret = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    User2BackLabel = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    User2Label = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    User2Text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsUser2Secret = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerfectDateCards", x => x.PerfectDateCardID);
                });

            migrationBuilder.AddColumn<int>(
                name: "PerfectDateCardID",
                table: "PerfectDateTasks",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "User1BackLabel",
                table: "PerfectDateTasks",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "User2BackLabel",
                table: "PerfectDateTasks",
                type: "nvarchar(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDateCards_CardCode_LanguageCode",
                table: "PerfectDateCards",
                columns: new[] { "CardCode", "LanguageCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDateCards_LanguageCode_IsActive",
                table: "PerfectDateCards",
                columns: new[] { "LanguageCode", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDateCards_TaskType_AudienceMode",
                table: "PerfectDateCards",
                columns: new[] { "TaskType", "AudienceMode" });

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDateTasks_PerfectDateCardID",
                table: "PerfectDateTasks",
                column: "PerfectDateCardID");

            migrationBuilder.AddForeignKey(
                name: "FK_PerfectDateTasks_PerfectDateCards",
                table: "PerfectDateTasks",
                column: "PerfectDateCardID",
                principalTable: "PerfectDateCards",
                principalColumn: "PerfectDateCardID",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PerfectDateTasks_PerfectDateCards",
                table: "PerfectDateTasks");

            migrationBuilder.DropIndex(
                name: "IX_PerfectDateTasks_PerfectDateCardID",
                table: "PerfectDateTasks");

            migrationBuilder.DropColumn(
                name: "PerfectDateCardID",
                table: "PerfectDateTasks");

            migrationBuilder.DropColumn(
                name: "User1BackLabel",
                table: "PerfectDateTasks");

            migrationBuilder.DropColumn(
                name: "User2BackLabel",
                table: "PerfectDateTasks");

            migrationBuilder.DropTable(name: "PerfectDateCards");
        }
    }
}
