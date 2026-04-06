using Chat.Application.Chats.Commands;
using Chat.Infrastructure.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Chat.API.Hubs;

[Authorize]
public class ChatHub(
    JoinChatHandler joinChatHandler,
    LeaveChatHandler leaveChatHandler,
    SendMessageHandler sendMessageHandler) : Hub<IChatClient>
{
    public async Task JoinChat(Guid chatId)
    {
        var userId = GetUserId();
        var userName = GetUserName();

        await Groups.AddToGroupAsync(Context.ConnectionId, chatId.ToString());
        await joinChatHandler.HandleAsync(Context.ConnectionId, userId, userName, chatId);
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
