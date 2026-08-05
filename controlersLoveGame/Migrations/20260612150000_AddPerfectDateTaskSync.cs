using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace controlersLoveGame.Migrations
{
    public partial class AddPerfectDateTaskSync : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "User1CompletedAt",
                table: "PerfectDateTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "User2CompletedAt",
                table: "PerfectDateTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDateTasks_PerfectDateID_User1CompletedAt_User2CompletedAt",
                table: "PerfectDateTasks",
                columns: new[] { "PerfectDateID", "User1CompletedAt", "User2CompletedAt" });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PerfectDateTasks_PerfectDateID_User1CompletedAt_User2CompletedAt",
                table: "PerfectDateTasks");

            migrationBuilder.DropColumn(
                name: "User1CompletedAt",
                table: "PerfectDateTasks");

            migrationBuilder.DropColumn(
                name: "User2CompletedAt",
                table: "PerfectDateTasks");
        }
    }
}
