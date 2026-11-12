using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MentorAI.API.Migrations
{
    /// <inheritdoc />
    public partial class AddScoreToTrainingAnswer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Score",
                table: "TrainingAnswers",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Score",
                table: "TrainingAnswers");
        }
    }
}
