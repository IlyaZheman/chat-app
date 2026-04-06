using Chat.Application.Chats.Commands;
using Chat.Application.Chats.Queries;
using Chat.Application.Users.Commands;
using Chat.Application.Users.Queries;

namespace Chat.API.Extensions;

public static class ApplicationExtension
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Users
        services.AddScoped<RegisterUserHandler>();
        services.AddScoped<LoginUserHandler>();

        // Chats
        services.AddScoped<JoinChatHandler>();
        services.AddScoped<LeaveChatHandler>();
        services.AddScoped<SendMessageHandler>();
        services.AddScoped<CreateGroupChatHandler>();
        services.AddScoped<GetOrCreatePrivateChatHandler>();

        // Queries
        services.AddScoped<GetUserChatsHandler>();
        services.AddScoped<GetChatMessagesHandler>();

        return services;
    }
}