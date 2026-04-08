using AutoMapper;
using Entities.Exceptions;
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

        public IEnumerable<ChatMemberDto> GetAll()
        {
            var members = _repository.ChatMember.GetAllMembers(trackChanges: false);
            return _mapper.Map<IEnumerable<ChatMemberDto>>(members);
        }

        public IEnumerable<UserDto> GetUsersByChatId(int chatId)
        {
            var chat = _repository.Chat.GetChat(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);

            var users = _repository.ChatMember.GetUsersByChatId(chatId, trackChanges: false);
            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public ChatMemberDto AddUserToChat(int chatId, ChatMemberForCreationDto memberDto)
        {
            var chat = _repository.Chat.GetChat(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);

            var member = new ChatMember
            {
                ChatId = chatId,
                UserId = memberDto.UserId
            };

            _repository.ChatMember.CreateMember(member);
            _repository.Save();

            return _mapper.Map<ChatMemberDto>(member);
        }

        public void RemoveUserFromChat(int chatId, int userId)
        {
            var chat = _repository.Chat.GetChat(chatId, trackChanges: false);
            if (chat is null)
                throw new ChatNotFoundException(chatId);

            var member = _repository.ChatMember.GetMember(chatId, userId, trackChanges: false);
            if (member is null)
                throw new ChatMemberNotFoundException(chatId, userId);

            _repository.ChatMember.DeleteMember(member);
            _repository.Save();
        }
    }
}