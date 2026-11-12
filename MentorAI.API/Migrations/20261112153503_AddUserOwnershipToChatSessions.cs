using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MentorAI.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserOwnershipToChatSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApplicationUserId",
                table: "ChatSessions",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatSessions_ApplicationUserId",
                table: "ChatSessions",
                column: "ApplicationUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatSessions_AspNetUsers_ApplicationUserId",
                table: "ChatSessions",
                column: "ApplicationUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

                migrationBuilder.Sql(@"
                    UPDATE ChatSessions
                    SET ApplicationUserId = (
                        SELECT Id FROM AspNetUsers
                        WHERE NormalizedEmail = 'MENTORAI-TEST@EXAMPLE.COM'
                    )
                    WHERE ApplicationUserId IS NULL
                    AND EXISTS (
                        SELECT 1 FROM AspNetUsers
                        WHERE NormalizedEmail = 'MENTORAI-TEST@EXAMPLE.COM'
                    );
                ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatSessions_AspNetUsers_ApplicationUserId",
                table: "ChatSessions");

            migrationBuilder.DropIndex(
                name: "IX_ChatSessions_ApplicationUserId",
                table: "ChatSessions");

            migrationBuilder.DropColumn(
                name: "ApplicationUserId",
                table: "ChatSessions");
        }
    }
}
