using Chat.API.Extensions;
using Chat.Application.Chats;
using Chat.Infrastructure.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Chat.API.Hubs;

[Authorize]
public class ChatHub(
    JoinChatHandler joinChatHandler,
    LeaveChatHandler leaveChatHandler,
    LeaveGroupChatHandler leaveGroupChatHandler,
    SendMessageHandler sendMessageHandler,
    UserPresenceHandler userPresenceHandler
) : Hub<IChatClient>
{
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        await userPresenceHandler.HandleConnectedAsync(userId, Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public async Task JoinChat(Guid chatId)
    {
        var userId = GetUserId();
        var userName = GetUserName();

        var previousChatId = await joinChatHandler.HandleAsync(Context.ConnectionId, userId, userName, chatId);
        if (previousChatId.HasValue && previousChatId.Value != chatId)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, previousChatId.Value.ToString());

        await Groups.AddToGroupAsync(Context.ConnectionId, chatId.ToString());
    }

    public async Task LeaveGroupChat()
    {
        var userId = GetUserId();
        var userName = GetUserName();

        var chatId = await leaveGroupChatHandler.HandleAsync(Context.ConnectionId, userId, userName);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId.ToString());
    }

    public async Task SendMessage(MessagePayloadDto payload)
    {
        var command = new SendMessageCommand(payload.ToDomain());
        await sendMessageHandler.HandleAsync(Context.ConnectionId, command);
    }

    public async Task StartTyping(Guid chatId) =>
        await Clients.GroupExcept(chatId.ToString(), [Context.ConnectionId])
            .UserTyping(chatId, GetUserName(), true);

    public async Task StopTyping(Guid chatId) =>
        await Clients.GroupExcept(chatId.ToString(), [Context.ConnectionId])
            .UserTyping(chatId, GetUserName(), false);

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await userPresenceHandler.HandleDisconnectedAsync(GetUserId(), Context.ConnectionId);
        await leaveChatHandler.HandleAsync(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    private Guid GetUserId() => Context.User!.GetUserId();

    private string GetUserName() => Context.User!.GetUserName();
}