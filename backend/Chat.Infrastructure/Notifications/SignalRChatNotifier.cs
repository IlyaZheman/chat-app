using Chat.Application.Interfaces;
using Chat.Domain.Models;
using Microsoft.AspNetCore.SignalR;

namespace Chat.Infrastructure.Notifications;

public class SignalRChatNotifier<THub>(IHubContext<THub, IChatClient> hubContext) : IChatNotifier
    where THub : Hub<IChatClient>
{
    public async Task NotifyMessageAsync(Guid chatId, string senderName, MessagePayload payload, CancellationToken ct = default)
    {
        await hubContext.Clients
            .Group(chatId.ToString())
            .ReceiveMessage(senderName, ToDto(payload));
    }

    public async Task NotifyUserJoinedAsync(Guid chatId, string userName, CancellationToken ct = default)
    {
        await hubContext.Clients
            .Group(chatId.ToString())
            .ReceiveMessage("System", new TextPayloadDto($"{userName} присоединился к чату"));
    }

    public async Task NotifyUserLeftAsync(Guid chatId, string userName, CancellationToken ct = default)
    {
        await hubContext.Clients
            .Group(chatId.ToString())
            .ReceiveMessage("System", new TextPayloadDto($"{userName} покинул чат"));
    }

    public async Task NotifyChatDeletedAsync(Guid chatId, CancellationToken ct = default)
    {
        await hubContext.Clients
            .Group(chatId.ToString())
            .ChatDeleted(chatId);
    }

    public async Task NotifyNewPrivateChatAsync(Guid targetUserId, CancellationToken ct = default)
    {
        await hubContext.Clients
            .Group($"user-{targetUserId}")
            .NewChatCreated();
    }

    private static MessagePayloadDto ToDto(MessagePayload payload) => payload switch
    {
        TextPayload t  => new TextPayloadDto(t.Text),
        ImagePayload i => new ImagePayloadDto(i.Url, i.FileName, i.Caption, i.CaptionPosition.ToString().ToLower(), i.FileSize),
        FilePayload f  => new FilePayloadDto(f.Url, f.FileName, f.MediaType, f.FileSize),
        _              => throw new NotSupportedException(payload.GetType().Name)
    };
}