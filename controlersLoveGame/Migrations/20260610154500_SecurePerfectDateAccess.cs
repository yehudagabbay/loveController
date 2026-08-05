using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace controlersLoveGame.Migrations
{
    public partial class SecurePerfectDateAccess : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatorAccessTokenHash",
                table: "PerfectDates",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "JoinedAccessTokenHash",
                table: "PerfectDates",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatorAccessTokenHash",
                table: "PerfectDates");

            migrationBuilder.DropColumn(
                name: "JoinedAccessTokenHash",
                table: "PerfectDates");
        }
    }
}
