namespace Chat.Domain.Exceptions;

public class DomainException(string message) : Exception(message);