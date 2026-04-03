using Chat.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApiDocs();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApiAuthentication(builder.Configuration);
builder.Services.AddApplication();

var app = builder.Build();

app.UseApiDocs();
app.UseInfrastructure();
app.UseApiAuthentication();
app.MapApiEndpoints();

app.Run();