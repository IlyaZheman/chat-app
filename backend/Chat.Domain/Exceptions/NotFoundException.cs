namespace Chat.Domain.Exceptions;

public class NotFoundException(string message) : Exception(message)
{
    public static NotFoundException For<T>(Guid id) =>
        new($"{typeof(T).Name} with id '{id}' was not found.");

    public static NotFoundException For<T>(string field, string value) =>
        new($"{typeof(T).Name} with {field} '{value}' was not found.");
}