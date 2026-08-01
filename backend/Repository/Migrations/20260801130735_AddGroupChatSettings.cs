using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupChatSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Chats",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "WhoCanEdit",
                table: "Chats",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "WhoCanInvite",
                table: "Chats",
                type: "integer",
                nullable: false,
                defaultValue: 2);

            migrationBuilder.AddColumn<int>(
                name: "WhoCanPost",
                table: "Chats",
                type: "integer",
                nullable: false,
                defaultValue: 3);

            migrationBuilder.UpdateData(
                table: "Chats",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Description", "WhoCanEdit", "WhoCanInvite", "WhoCanPost" },
                values: new object[] { null, 2, 2, 3 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "Chats");

            migrationBuilder.DropColumn(
                name: "WhoCanEdit",
                table: "Chats");

            migrationBuilder.DropColumn(
                name: "WhoCanInvite",
                table: "Chats");

            migrationBuilder.DropColumn(
                name: "WhoCanPost",
                table: "Chats");
        }
    }
}
