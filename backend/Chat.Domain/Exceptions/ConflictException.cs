namespace Chat.Domain.Exceptions;

public class ConflictException(string message) : Exception(message);