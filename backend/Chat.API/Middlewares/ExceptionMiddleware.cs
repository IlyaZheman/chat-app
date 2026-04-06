using System.Net;
using Chat.API.Contracts;

namespace Chat.API.Middlewares;

public class ExceptionMiddleware : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            var error = new ErrorResponse((int)HttpStatusCode.InternalServerError, ex.Message);
            await context.Response.WriteAsJsonAsync(error);
        }
    }
}