namespace AGMS.Application.Contracts;

public interface IEmailSender
{
    Task SendEmailAsync(string toEmail, string subject, string body, CancellationToken ct);
}

