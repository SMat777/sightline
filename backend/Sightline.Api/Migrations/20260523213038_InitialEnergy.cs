using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Sightline.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialEnergy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Weather",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ZoneId = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    WindMs = table.Column<double>(type: "double precision", nullable: false),
                    SolarRadiation = table.Column<double>(type: "double precision", nullable: false),
                    TempC = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Weather", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Zones",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Name = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Zones", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Hours",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ZoneId = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Timestamp = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    SpotPriceDkkKwh = table.Column<double>(type: "double precision", nullable: false),
                    Co2IntensityGKwh = table.Column<double>(type: "double precision", nullable: false),
                    WindShare = table.Column<double>(type: "double precision", nullable: false),
                    SolarShare = table.Column<double>(type: "double precision", nullable: false),
                    FossilShare = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Hours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Hours_Zones_ZoneId",
                        column: x => x.ZoneId,
                        principalTable: "Zones",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Hours_ZoneId_Timestamp",
                table: "Hours",
                columns: new[] { "ZoneId", "Timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_Weather_ZoneId_Timestamp",
                table: "Weather",
                columns: new[] { "ZoneId", "Timestamp" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Hours");

            migrationBuilder.DropTable(
                name: "Weather");

            migrationBuilder.DropTable(
                name: "Zones");
        }
    }
}
