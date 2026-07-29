using Services.Interfaces;

public class AbandonedAttachmentCleaner : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);
    private static readonly TimeSpan KeepUnsentFor = TimeSpan.FromHours(24);

    private readonly IServiceProvider _services;
    private readonly ILoggerManager _logger;

    public AbandonedAttachmentCleaner(IServiceProvider services, ILoggerManager logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);

        do
        {
            try
            {
                using var scope = _services.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IServiceManager>();
                var removed = await service.Attachment.RemoveAbandonedAsync(KeepUnsentFor);

                if (removed > 0)
                    _logger.LogInfo($"Removed {removed} abandoned attachments.");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Abandoned attachment cleanup failed: {ex}");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
