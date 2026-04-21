using Chat.Application.Auth.Login;
using Chat.Application.Auth.Register;
using Chat.Application.Chats.AddMemberToGroupChat;
using Chat.Application.Chats.CreateGroupChat;
using Chat.Application.Chats.GetChatMessages;
using Chat.Application.Chats.GetOrCreatePrivateChat;
using Chat.Application.Chats.GetUserChats;
using Chat.Application.Chats.JoinChat;
using Chat.Application.Chats.LeaveChat;
using Chat.Application.Chats.LeaveGroupChat;
using Chat.Application.Chats.SendMessage;

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

        return services;
    }
}