using Contracts;
using Entities.Models;

namespace internship.Services
{
    public class ChatService
    {
        private readonly IRepositoryManager _repository;

        public ChatService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<Chat> GetAll() =>
            _repository.Chat.GetAllChats(trackChanges: false);

        public Chat? GetById(int id) =>
            _repository.Chat.GetChat(id, trackChanges: false);

        public Chat Create(Chat chat)
        {
            _repository.Chat.CreateChat(chat);
            _repository.Save();
            return chat;
        }

        public Chat? Update(int id, Chat updated)
        {
            var chat = _repository.Chat.GetChat(id, trackChanges: true);
            if (chat == null) return null;
            chat.Name = updated.Name;
            _repository.Save();
            return chat;
        }

        public bool Delete(int id)
        {
            var chat = _repository.Chat.GetChat(id, trackChanges: false);
            if (chat == null) return false;
            _repository.Chat.DeleteChat(chat);
            _repository.Save();
            return true;
        }
    }
}