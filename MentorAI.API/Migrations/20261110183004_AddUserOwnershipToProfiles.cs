using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MentorAI.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserOwnershipToProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApplicationUserId",
                table: "UserProfiles",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApplicationUserId",
                table: "LearningProfiles",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserProfiles_ApplicationUserId",
                table: "UserProfiles",
                column: "ApplicationUserId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningProfiles_ApplicationUserId",
                table: "LearningProfiles",
                column: "ApplicationUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_LearningProfiles_AspNetUsers_ApplicationUserId",
                table: "LearningProfiles",
                column: "ApplicationUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserProfiles_AspNetUsers_ApplicationUserId",
                table: "UserProfiles",
                column: "ApplicationUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LearningProfiles_AspNetUsers_ApplicationUserId",
                table: "LearningProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_UserProfiles_AspNetUsers_ApplicationUserId",
                table: "UserProfiles");

            migrationBuilder.DropIndex(
                name: "IX_UserProfiles_ApplicationUserId",
                table: "UserProfiles");

            migrationBuilder.DropIndex(
                name: "IX_LearningProfiles_ApplicationUserId",
                table: "LearningProfiles");

            migrationBuilder.DropColumn(
                name: "ApplicationUserId",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "ApplicationUserId",
                table: "LearningProfiles");
        }
    }
}
