using System.Security.Claims;
using Entities.Models;
using Microsoft.AspNetCore.Http;
using Repository.Interfaces;
using Services.Interfaces;

namespace Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IRepositoryManager _repository;
        private readonly Dictionary<int, ChatMember?> _membershipCache = new();

        public CurrentUserService(IHttpContextAccessor httpContextAccessor, IRepositoryManager repository)
        {
            _httpContextAccessor = httpContextAccessor;
            _repository = repository;
        }

        public int UserId =>
            int.Parse(_httpContextAccessor.HttpContext?
                .User
                .FindFirst(ClaimTypes.NameIdentifier)?.Value!);

        public string? UserName =>
            _httpContextAccessor.HttpContext?
                .User
                .FindFirst(ClaimTypes.Name)?.Value;

        public async Task<ChatMember?> GetMembershipAsync(int chatId)
        {
            if (_membershipCache.TryGetValue(chatId, out var cached))
                return cached;

            var member = await _repository.ChatMember.GetMemberAsync(chatId, UserId, trackChanges: false);
            _membershipCache[chatId] = member;
            return member;
        }
    }
}
