using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MentorAI.API.Migrations
{
    /// <inheritdoc />
    public partial class AssignLegacyProfilesToTestAccount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE UserProfiles
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

            migrationBuilder.Sql(@"
                UPDATE LearningProfiles
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

        }
    }
}
