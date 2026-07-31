using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddSymmetricFriendshipIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Friendships_RequesterId_AddresseeId",
                table: "Friendships");

            migrationBuilder.CreateIndex(
                name: "IX_Friendships_RequesterId",
                table: "Friendships",
                column: "RequesterId");

            // одна связь на пару в любом направлении: A->B и B->A взаимоисключающие
            migrationBuilder.Sql(@"
                CREATE UNIQUE INDEX ""IX_Friendships_Pair""
                ON ""Friendships"" (LEAST(""RequesterId"", ""AddresseeId""),
                                    GREATEST(""RequesterId"", ""AddresseeId""));");

            migrationBuilder.Sql(@"
                ALTER TABLE ""Friendships""
                ADD CONSTRAINT ""CK_Friendships_Status""
                CHECK (""Status"" IN (1, 2));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""Friendships"" DROP CONSTRAINT ""CK_Friendships_Status"";");
            migrationBuilder.Sql(@"DROP INDEX ""IX_Friendships_Pair"";");

            migrationBuilder.DropIndex(
                name: "IX_Friendships_RequesterId",
                table: "Friendships");

            migrationBuilder.CreateIndex(
                name: "IX_Friendships_RequesterId_AddresseeId",
                table: "Friendships",
                columns: new[] { "RequesterId", "AddresseeId" },
                unique: true);
        }
    }
}
