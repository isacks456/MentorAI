using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MentorAI.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnouncements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Announcements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "TEXT", maxLength: 8000, nullable: false),
                    CreatedByUserId = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    SentAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LastTestSentAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TotalRecipients = table.Column<int>(type: "INTEGER", nullable: false),
                    SentCount = table.Column<int>(type: "INTEGER", nullable: false),
                    SkippedCount = table.Column<int>(type: "INTEGER", nullable: false),
                    FailedCount = table.Column<int>(type: "INTEGER", nullable: false),
                    UndefinedCount = table.Column<int>(type: "INTEGER", nullable: false),
                    PendingCount = table.Column<int>(type: "INTEGER", nullable: false),
                    SendClaimedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    SendClaimToken = table.Column<string>(type: "TEXT", nullable: true),
                    CancelRequestedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Announcements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AnnouncementRecipients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    AnnouncementId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    Reason = table.Column<string>(type: "TEXT", maxLength: 300, nullable: true),
                    AttemptCount = table.Column<int>(type: "INTEGER", nullable: false),
                    AttemptStartedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ProcessingLeaseUntil = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnouncementRecipients", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnouncementRecipients_Announcements_AnnouncementId",
                        column: x => x.AnnouncementId,
                        principalTable: "Announcements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AnnouncementRecipients_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementRecipients_AnnouncementId_Status",
                table: "AnnouncementRecipients",
                columns: new[] { "AnnouncementId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementRecipients_AnnouncementId_UserId",
                table: "AnnouncementRecipients",
                columns: new[] { "AnnouncementId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AnnouncementRecipients_UserId",
                table: "AnnouncementRecipients",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_CreatedAt",
                table: "Announcements",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_Status",
                table: "Announcements",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnnouncementRecipients");

            migrationBuilder.DropTable(
                name: "Announcements");
        }
    }
}
