using AutoMapper;
using Shared.Exceptions;
using Entities.Models;
using Repository.Interfaces;
using Services.DataTransferObjects;
using Services.Interfaces;

namespace Services
{
    public class ChatMemberService : IChatMemberService
    {
        private readonly IRepositoryManager _repository;
        private readonly ILoggerManager _logger;
        private readonly IMapper _mapper;

        public ChatMemberService(IRepositoryManager repository, ILoggerManager logger, IMapper mapper)
        {
            _repository = repository;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<IEnumerable<UserDto>> GetUsersByChatIdAsync(int chatId)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            var users = await _repository.ChatMember.GetUsersByChatIdAsync(chatId, trackChanges: false);
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<ChatMemberDto> AddUserToChatAsync(int chatId, ChatMemberForCreationDto memberDto)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            var member = new ChatMember { ChatId = chatId, UserId = memberDto.UserId };
            _repository.ChatMember.CreateMember(member);
            await _repository.SaveAsync();
            return _mapper.Map<ChatMemberDto>(member);
        }

        public async Task RemoveUserFromChatAsync(int chatId, int userId)
        {
            var chat = await _repository.Chat.GetChatAsync(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);
            var member = await _repository.ChatMember.GetMemberAsync(chatId, userId, trackChanges: false);
            if (member is null)
                throw new ChatMemberNotFoundException(chatId, userId);
            _repository.ChatMember.DeleteMember(member);
            await _repository.SaveAsync();
        }
    }
}