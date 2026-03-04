using System.Net;
using System.Net.Mail;
using AGMS.Application.Contracts;
using Microsoft.Extensions.Configuration;

namespace AGMS.Infrastructure.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;

    public SmtpEmailSender(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body, CancellationToken ct)
    {
        var host = _configuration["Email:Smtp:Host"]
                   ?? throw new InvalidOperationException("Email:Smtp:Host is not configured.");
        var portString = _configuration["Email:Smtp:Port"]
                         ?? throw new InvalidOperationException("Email:Smtp:Port is not configured.");
        if (!int.TryParse(portString, out var port))
            throw new InvalidOperationException("Email:Smtp:Port is not a valid integer.");

        var enableSsl = bool.TryParse(_configuration["Email:Smtp:EnableSsl"], out var ssl) && ssl;

        var username = _configuration["Email:Smtp:Username"]
                       ?? throw new InvalidOperationException("Email:Smtp:Username is not configured.");
        var password = _configuration["Email:Smtp:Password"]
                       ?? throw new InvalidOperationException("Email:Smtp:Password is not configured.");
        var from = _configuration["Email:From"]
                   ?? username;

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl,
            Credentials = new NetworkCredential(username, password)
        };

        using var message = new MailMessage(from, toEmail, subject, body);
        message.IsBodyHtml = false;

        // SmtpClient in .NET 8 still exposes SendMailAsync for simple scenarios
        await client.SendMailAsync(message, ct);
    }
}

