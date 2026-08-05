using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace controlersLoveGame.Migrations
{
    public partial class AddPerfectDateParticipantAge : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "User1Age",
                table: "PerfectDates",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "User2Age",
                table: "PerfectDates",
                type: "int",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "User1Age",
                table: "PerfectDates");

            migrationBuilder.DropColumn(
                name: "User2Age",
                table: "PerfectDates");
        }
    }
}
