using System;
using internship;
using internship.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ChatService>();
builder.Services.AddScoped<ChatMemberService>();
builder.Services.AddScoped<MessageService>();

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    bool canConnect = db.Database.CanConnect();

    if (canConnect)
    {
        Console.WriteLine("connect! ");
    }
    else
    {
        Console.WriteLine("no connect! ");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "My API v1");
        options.RoutePrefix = "swagger";  // или "" — чтобы был на корне     });
    });
}

app.UseHttpsRedirection();

    app.UseAuthorization();

    app.MapControllers();

    app.Run();
