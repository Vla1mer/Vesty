using Repository.Interfaces;
using Entities.Models;
using Services.Interfaces;

namespace Services
{
    public class ChatMemberService : IChatMemberService
    {
        private readonly IRepositoryManager _repository;

        public ChatMemberService(IRepositoryManager repository)
            => _repository = repository;

        public IEnumerable<ChatMember> GetAll() =>
            _repository.ChatMember.GetAllMembers(trackChanges: false);
    }
}