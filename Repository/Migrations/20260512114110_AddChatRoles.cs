using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddChatRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChatRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatRoles", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ChatRoles",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Owner" },
                    { 2, "Admin" },
                    { 3, "User" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatRoles_Name",
                table: "ChatRoles",
                column: "Name",
                unique: true);

            migrationBuilder.AddColumn<int>(
                name: "RoleId",
                table: "ChatMembers",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.CreateIndex(
                name: "IX_ChatMembers_RoleId",
                table: "ChatMembers",
                column: "RoleId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatMembers_ChatRoles_RoleId",
                table: "ChatMembers",
                column: "RoleId",
                principalTable: "ChatRoles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatMembers_ChatRoles_RoleId",
                table: "ChatMembers");

            migrationBuilder.DropIndex(
                name: "IX_ChatMembers_RoleId",
                table: "ChatMembers");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "ChatMembers");

            migrationBuilder.DropTable(
                name: "ChatRoles");
        }
    }
}
