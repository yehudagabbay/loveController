using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace controlersLoveGame.Migrations
{
    public partial class AddPerfectDateTables : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PerfectDates",
                columns: table => new
                {
                    PerfectDateID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DateNumber = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    Location = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Created"),
                    User1ID = table.Column<int>(type: "int", nullable: true),
                    User2ID = table.Column<int>(type: "int", nullable: true),
                    ScheduledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    StartedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerfectDates", x => x.PerfectDateID);
                });

            migrationBuilder.CreateTable(
                name: "PerfectDateTasks",
                columns: table => new
                {
                    PerfectDateTaskID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PerfectDateID = table.Column<int>(type: "int", nullable: false),
                    SequenceNumber = table.Column<int>(type: "int", nullable: false),
                    TaskType = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    AudienceMode = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    User1Label = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    User1Text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsUser1Secret = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    User2Label = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    User2Text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsUser2Secret = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    IsRevealed = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    RevealedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerfectDateTasks", x => x.PerfectDateTaskID);
                    table.ForeignKey(
                        name: "FK_PerfectDateTasks_PerfectDates",
                        column: x => x.PerfectDateID,
                        principalTable: "PerfectDates",
                        principalColumn: "PerfectDateID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDates_DateNumber",
                table: "PerfectDates",
                column: "DateNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDates_Status_ScheduledAt",
                table: "PerfectDates",
                columns: new[] { "Status", "ScheduledAt" });

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDates_User1ID_User2ID",
                table: "PerfectDates",
                columns: new[] { "User1ID", "User2ID" });

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDateTasks_PerfectDateID_IsRevealed",
                table: "PerfectDateTasks",
                columns: new[] { "PerfectDateID", "IsRevealed" });

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDateTasks_PerfectDateID_SequenceNumber",
                table: "PerfectDateTasks",
                columns: new[] { "PerfectDateID", "SequenceNumber" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PerfectDateTasks");
            migrationBuilder.DropTable(name: "PerfectDates");
        }
    }
}
