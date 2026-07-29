namespace Shared.Exceptions
{
    public sealed class AttachmentNotFoundException : NotFoundException
    {
        public AttachmentNotFoundException(int id)
            : base($"Attachment with id: {id} doesn't exist in the database.")
        {
        }
    }
}
