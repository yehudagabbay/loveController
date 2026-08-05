using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace controlersLoveGame.Migrations
{
    public partial class AddPerfectDateRevealReady : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "User1RevealReadyAt",
                table: "PerfectDateTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "User2RevealReadyAt",
                table: "PerfectDateTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDateTasks_PerfectDateID_User1RevealReadyAt_User2RevealReadyAt",
                table: "PerfectDateTasks",
                columns: new[] { "PerfectDateID", "User1RevealReadyAt", "User2RevealReadyAt" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PerfectDateTasks_PerfectDateID_User1RevealReadyAt_User2RevealReadyAt",
                table: "PerfectDateTasks");

            migrationBuilder.DropColumn(
                name: "User1RevealReadyAt",
                table: "PerfectDateTasks");

            migrationBuilder.DropColumn(
                name: "User2RevealReadyAt",
                table: "PerfectDateTasks");
        }
    }
}
