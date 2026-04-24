using Chat.Application.Admin;
using Chat.Application.Auth.Login;
using Chat.Application.Auth.Register;
using Chat.Application.Chats;

namespace Chat.API.Extensions;

public static class ApplicationExtension
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<RegisterUserHandler>();
        services.AddScoped<LoginUserHandler>();

        services.AddScoped<JoinChatHandler>();
        services.AddScoped<LeaveChatHandler>();
        services.AddScoped<SendMessageHandler>();
        services.AddScoped<CreateGroupChatHandler>();
        services.AddScoped<GetOrCreatePrivateChatHandler>();
        services.AddScoped<GetUserChatsHandler>();
        services.AddScoped<GetChatMessagesHandler>();
        services.AddScoped<AddMemberToGroupChatHandler>();
        services.AddScoped<LeaveGroupChatHandler>();
        services.AddScoped<DeleteGroupChatHandler>();
        services.AddScoped<RemoveMemberFromGroupChatHandler>();
        services.AddScoped<GetAllGroupsHandler>();
        services.AddScoped<JoinGroupChatHandler>();

        services.AddScoped<GetAllUsersHandler>();
        services.AddScoped<AssignUserRoleHandler>();

        return services;
    }
}
