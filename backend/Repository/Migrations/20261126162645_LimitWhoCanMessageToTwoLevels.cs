using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repository.Migrations
{
    /// <inheritdoc />
    public partial class LimitWhoCanMessageToTwoLevels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE ""AspNetUsers""
                SET ""WhoCanMessage"" = 2
                WHERE ""WhoCanMessage"" = 3;");

            migrationBuilder.Sql(@"
                ALTER TABLE ""AspNetUsers""
                ADD CONSTRAINT ""CK_AspNetUsers_WhoCanMessage""
                CHECK (""WhoCanMessage"" IN (1, 2));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"ALTER TABLE ""AspNetUsers"" DROP CONSTRAINT ""CK_AspNetUsers_WhoCanMessage"";");
        }
    }
}
