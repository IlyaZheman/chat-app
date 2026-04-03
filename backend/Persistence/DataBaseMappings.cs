using AutoMapper;
using Persistence.Entities;
using Persistence.Models;

namespace Persistence;

public class DataBaseMappings : Profile
{
    public DataBaseMappings()
    {
        CreateMap<UserEntity, User>();
    }
}