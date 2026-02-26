// ================================================================
// DEMO 6 (Step 6B): THE SIGNALR HUB — Real-Time Broadcast Station
// ================================================================

using Microsoft.AspNetCore.SignalR;

namespace API.Hubs
{
    public class CalculationHub : Hub
    {
        // Called automatically when a client connects
        public override async Task OnConnectedAsync()
        {
            Console.WriteLine($"Client connected: {Context.ConnectionId}");
            await base.OnConnectedAsync();
        }

        // Called automatically when a client disconnects
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            Console.WriteLine($"Client disconnected: {Context.ConnectionId}");
            await base.OnDisconnectedAsync(exception);
        }
    }
}
