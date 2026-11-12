using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MentorAI.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTrainingTasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TrainingTasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Question = table.Column<string>(type: "TEXT", nullable: false),
                    TrainingScenarioId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TrainingTasks_TrainingScenarios_TrainingScenarioId",
                        column: x => x.TrainingScenarioId,
                        principalTable: "TrainingScenarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TrainingTasks_TrainingScenarioId",
                table: "TrainingTasks",
                column: "TrainingScenarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TrainingTasks");
        }
    }
}
