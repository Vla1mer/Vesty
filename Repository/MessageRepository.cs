using Entities.Models;
using Microsoft.EntityFrameworkCore;
using Repository.Interfaces;
using Entities.RequestFeatures;
using Repository.Extensions;

namespace Repository
{
    public class MessageRepository : RepositoryBase<Message>, IMessageRepository
    {
        public MessageRepository(AppDbContext context) : base(context) { }

        public async Task<PagedList<Message>> GetAllMessagesAsync(MessageParameters messageParameters, bool trackChanges)
        {
            var messages = await FindAll(trackChanges)
                .FilterByCreatedAt(messageParameters.MinCreatedAt, messageParameters.MaxCreatedAt)
                .FilterByChatId(messageParameters.ChatId)
                .FilterByUserId(messageParameters.UserId)
                .Search(messageParameters.SearchTerm)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            return PagedList<Message>.ToPagedList(messages, messageParameters.PageNumber, messageParameters.PageSize);
        }

        public async Task<Message?> GetMessageAsync(int id, bool trackChanges) =>
            await FindByCondition(m => m.Id == id, trackChanges).FirstOrDefaultAsync();

        public async Task<IEnumerable<Message>> GetMessagesByChatAsync(int chatId, bool trackChanges) =>
            await FindByCondition(m => m.ChatId == chatId, trackChanges).ToListAsync();

        public void CreateMessage(Message message) => Create(message);

        public void CreateMessageForChat(int chatId, Message message)
        {
            message.ChatId = chatId;
            Create(message);
        }

        public void DeleteMessage(Message message) => Delete(message);
    }
}