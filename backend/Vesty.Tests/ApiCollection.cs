namespace Vesty.Tests
{
    [CollectionDefinition(Name)]
    public class ApiCollection : ICollectionFixture<VestyApiFactory>
    {
        public const string Name = "Api";
    }
}
