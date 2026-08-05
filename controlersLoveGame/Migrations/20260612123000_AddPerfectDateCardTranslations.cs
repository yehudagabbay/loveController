using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace controlersLoveGame.Migrations
{
    public partial class AddPerfectDateCardTranslations : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PerfectDateCardTranslations",
                columns: table => new
                {
                    PerfectDateCardTranslationID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PerfectDateCardID = table.Column<int>(type: "int", nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    User1BackLabel = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    User1Label = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    User1Text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    User2BackLabel = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    User2Label = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: true),
                    User2Text = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerfectDateCardTranslations", x => x.PerfectDateCardTranslationID);
                    table.ForeignKey(
                        name: "FK_PerfectDateCardTranslations_PerfectDateCards",
                        column: x => x.PerfectDateCardID,
                        principalTable: "PerfectDateCards",
                        principalColumn: "PerfectDateCardID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PerfectDateCardTranslations_PerfectDateCardID_LanguageCode",
                table: "PerfectDateCardTranslations",
                columns: new[] { "PerfectDateCardID", "LanguageCode" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PerfectDateCardTranslations");
        }
    }
}
