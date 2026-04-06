using AutoMapper;
using Chat.Domain.Models;
using Chat.Infrastructure.Persistence.Entities;

namespace Chat.Infrastructure.Persistence.Mappings;

public class PersistenceMappings : Profile
{
    public PersistenceMappings()
    {
        CreateMap<UserEntity, User>()
            .ConstructUsing(e => User.Create(e.UserName, e.Email, e.PasswordHash));
    }
}