using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MentorAI.API.Migrations
{
    /// <inheritdoc />
    public partial class AddUserOwnershipToTrainingAnswers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApplicationUserId",
                table: "TrainingAnswers",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrainingAnswers_ApplicationUserId",
                table: "TrainingAnswers",
                column: "ApplicationUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TrainingAnswers_AspNetUsers_ApplicationUserId",
                table: "TrainingAnswers",
                column: "ApplicationUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.Sql(@"
                UPDATE TrainingAnswers
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
                name: "FK_TrainingAnswers_AspNetUsers_ApplicationUserId",
                table: "TrainingAnswers");

            migrationBuilder.DropIndex(
                name: "IX_TrainingAnswers_ApplicationUserId",
                table: "TrainingAnswers");

            migrationBuilder.DropColumn(
                name: "ApplicationUserId",
                table: "TrainingAnswers");
        }
    }
}
