using internship;
using internship.Extensions;
using internship.Services;
using Microsoft.EntityFrameworkCore;
using NLog;

var currentDir = Directory.GetCurrentDirectory();
LogManager.LoadConfiguration(Path.Combine(currentDir, "nlog.config"));
NLog.GlobalDiagnosticsContext.Set("logDir", Path.Combine(currentDir, "logs"));
NLog.GlobalDiagnosticsContext.Set("internalLogDir", Path.Combine(currentDir, "internal_logs"));

var builder = WebApplication.CreateBuilder(args);

builder.Services.ConfigureCors();
builder.Services.ConfigureIISIntegration();
builder.Services.ConfigureLoggerService();
builder.Services.ConfigureRepositoryManager();
builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.ConfigureServiceManager();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "My API v1");
        options.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors("CorsPolicy");
app.UseAuthorization();
app.MapControllers();
app.Run();