namespace AGMS.Application.Exceptions;

public class EmailNotVerifiedException : InvalidOperationException
{
    public bool IsExpired { get; }

    public EmailNotVerifiedException(string message, bool isExpired)
        : base(message)
    {
        IsExpired = isExpired;
    }
}

