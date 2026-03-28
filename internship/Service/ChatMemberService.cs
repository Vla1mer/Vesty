using Contracts;
using Entities.Models;

namespace internship.Services
{
    public class ChatMemberService
    {
        private readonly IRepositoryManager _repository;

        public ChatMemberService(IRepositoryManager repository)
            => _repository = repository;

        public async Task<IEnumerable<ChatMember>> GetAllAsync() =>
            await _repository.ChatMember.GetAllMembersAsync(trackChanges: false);

        public async Task<ChatMember?> GetByIdAsync(int chatId, int userId) =>
            await _repository.ChatMember.GetMemberAsync(chatId, userId, trackChanges: false);

        public async Task<ChatMember> CreateAsync(ChatMember member)
        {
            member.CreatedAt = DateTime.UtcNow;
            _repository.ChatMember.CreateMember(member);
            await _repository.SaveAsync();
            return member;
        }

        public async Task<bool> DeleteAsync(int chatId, int userId)
        {
            var member = await _repository.ChatMember.GetMemberAsync(chatId, userId, trackChanges: false);
            if (member == null) return false;

            _repository.ChatMember.DeleteMember(member);
            await _repository.SaveAsync();
            return true;
        }
    }
}