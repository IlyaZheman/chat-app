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
    SendMessageHandler sendMessageHandler) : Hub<IChatClient>
{
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        await base.OnConnectedAsync();
    }

    public async Task JoinChat(Guid chatId)
    {
        var userId = GetUserId();
        var userName = GetUserName();

        await Groups.AddToGroupAsync(Context.ConnectionId, chatId.ToString());
        await joinChatHandler.HandleAsync(Context.ConnectionId, userId, userName, chatId);
    }

    public async Task LeaveGroupChat()
    {
        var userId = GetUserId();
        var userName = GetUserName();

        var chatId = await leaveGroupChatHandler.HandleAsync(Context.ConnectionId, userId, userName);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatId.ToString());
    }

    public async Task SendMessage(string text)
    {
        await sendMessageHandler.HandleAsync(Context.ConnectionId, text);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await leaveChatHandler.HandleAsync(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    private Guid GetUserId() =>
        Guid.Parse(Context.User?.FindFirst("userId")?.Value
                   ?? throw new HubException("Unauthorized"));

    private string GetUserName() =>
        Context.User?.FindFirst("userName")?.Value
        ?? throw new HubException("Unauthorized");

}