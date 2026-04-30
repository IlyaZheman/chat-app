using System.Net;
using Chat.API.Contracts;
using Chat.Domain.Exceptions;

namespace Chat.API.Middlewares;

public class ExceptionMiddleware(ILogger<ExceptionMiddleware> logger) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Unhandled exception for {Method} {Path}",
                context.Request.Method,
                context.Request.Path);
            await HandleAsync(context, ex);
        }
    }

    private static Task HandleAsync(HttpContext context, Exception ex)
    {
        var (status, message) = ex switch
        {
            NotFoundException e => (HttpStatusCode.NotFound, e.Message),
            UnauthorizedException e => (HttpStatusCode.Unauthorized, e.Message),
            ForbiddenException e => (HttpStatusCode.Forbidden, e.Message),
            ConflictException e => (HttpStatusCode.Conflict, e.Message),
            DomainException e => (HttpStatusCode.BadRequest, e.Message),
            InvalidOperationException e => (HttpStatusCode.BadRequest, e.Message),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred.")
        };

        context.Response.StatusCode = (int)status;
        return context.Response.WriteAsJsonAsync(new ErrorResponse((int)status, message));
    }
}