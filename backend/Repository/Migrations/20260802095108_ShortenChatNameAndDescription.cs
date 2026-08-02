using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Repository.Migrations
{
    /// <summary>
    /// Narrows Chats.Name to 100 and Chats.Description to 255. Postgres refuses to
    /// shrink a column while longer values exist, so anything over the new limit is
    /// truncated first. That truncation is one-way: Down widens the columns back but
    /// cannot restore the cut characters. Back up the table before applying this to
    /// data you care about.
    /// </summary>
    public partial class ShortenChatNameAndDescription : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE "Chats"
                SET "Name" = LEFT("Name", 100)
                WHERE "Name" IS NOT NULL AND LENGTH("Name") > 100;

                UPDATE "Chats"
                SET "Description" = LEFT("Description", 255)
                WHERE "Description" IS NOT NULL AND LENGTH("Description") > 255;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Chats",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Chats",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Chats",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "Chats",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255,
                oldNullable: true);
        }
    }
}
