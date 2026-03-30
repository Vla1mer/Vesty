using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace internship.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSeedPassword : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "Password",
                value: "$2a$11$RYpLh2oXgpwv9DfhtoYR5ejTjMdkh44aqIZST1pgRKQZfY0Ay3Of.");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "Password",
                value: "admin123");
        }
    }
}
