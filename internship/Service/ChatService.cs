using Contracts;
using Entities.Models;

namespace internship.Services
{
    public class ChatService
    {
        private readonly IRepositoryManager _repository;

        public ChatService(IRepositoryManager repository)
            => _repository = repository;

        public async Task<IEnumerable<Chat>> GetAllAsync() =>
            await _repository.Chat.GetAllChatsAsync(trackChanges: false);

        public async Task<Chat?> GetByIdAsync(int id) =>
            await _repository.Chat.GetChatAsync(id, trackChanges: false);

        public async Task<Chat> CreateAsync(Chat chat)
        {
            chat.CreatedAt = DateTime.UtcNow;
            _repository.Chat.CreateChat(chat);
            await _repository.SaveAsync();
            return chat;
        }

        public async Task<Chat?> UpdateAsync(int id, Chat updated)
        {
            var chat = await _repository.Chat.GetChatAsync(id, trackChanges: true);
            if (chat == null) return null;

            chat.Name = updated.Name;

            await _repository.SaveAsync();
            return chat;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var chat = await _repository.Chat.GetChatAsync(id, trackChanges: false);
            if (chat == null) return false;

            _repository.Chat.DeleteChat(chat);
            await _repository.SaveAsync();
            return true;
        }
    }
}