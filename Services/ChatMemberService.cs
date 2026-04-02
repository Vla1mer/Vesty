using AutoMapper;
using Repository.Interfaces;
using Entities.Exceptions;
using Services.Interfaces;
using Services.DataTransferObjects;

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

        public ChatMemberDto GetById(int chatId, int userId)
        {
            var member = _repository.ChatMember.GetMember(chatId, userId, trackChanges: false);
            if (member is null)
                throw new ChatMemberNotFoundException(chatId, userId);

            return _mapper.Map<ChatMemberDto>(member);
        }
    }
}