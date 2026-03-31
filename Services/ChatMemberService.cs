using Repository.Interfaces;
using Entities.Models;

namespace Services
{
    public class ChatMemberService
    {
        private readonly IRepositoryManager _repository;

        public ChatMemberService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<ChatMember> GetAll() =>
            _repository.ChatMember.GetAllMembers(trackChanges: false);

    }
}