using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueChatMemberIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatInvites_AspNetUsers_CreatedById",
                table: "ChatInvites");

            migrationBuilder.DropIndex(
                name: "IX_ChatMembers_ChatId",
                table: "ChatMembers");

            migrationBuilder.AlterColumn<int>(
                name: "CreatedById",
                table: "ChatInvites",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMembers_ChatId_UserId",
                table: "ChatMembers",
                columns: new[] { "ChatId", "UserId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ChatInvites_AspNetUsers_CreatedById",
                table: "ChatInvites",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatInvites_AspNetUsers_CreatedById",
                table: "ChatInvites");

            migrationBuilder.DropIndex(
                name: "IX_ChatMembers_ChatId_UserId",
                table: "ChatMembers");

            migrationBuilder.AlterColumn<int>(
                name: "CreatedById",
                table: "ChatInvites",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatMembers_ChatId",
                table: "ChatMembers",
                column: "ChatId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatInvites_AspNetUsers_CreatedById",
                table: "ChatInvites",
                column: "CreatedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
