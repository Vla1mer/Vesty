using Contracts;
using Entities.Models;

namespace internship.Services
{
    public class ChatMemberService
    {
        private readonly IRepositoryManager _repository;

        public ChatMemberService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<ChatMember> GetAll() =>
            _repository.ChatMember.GetAllMembers(trackChanges: false);

        public ChatMember? GetById(int chatId, int userId) =>
            _repository.ChatMember.GetMember(chatId, userId, trackChanges: false);

        public ChatMember Create(ChatMember member)
        {
            _repository.ChatMember.CreateMember(member);
            _repository.Save();
            return member;
        }

        public bool Delete(int chatId, int userId)
        {
            var member = _repository.ChatMember.GetMember(chatId, userId, trackChanges: false);
            if (member == null) return false;
            _repository.ChatMember.DeleteMember(member);
            _repository.Save();
            return true;
        }
    }
}