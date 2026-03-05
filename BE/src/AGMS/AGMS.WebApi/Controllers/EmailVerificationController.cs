using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Auth;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/email-verification")]
public class EmailVerificationController : ControllerBase
{
    private readonly IAuthService _authService;

    public EmailVerificationController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST /api/email-verification/send-otp
    [HttpPost("send-otp")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendOtp([FromBody] EmailVerificationSendOtpRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _authService.SendEmailVerificationOtpAsync(req, ct);
            return Ok(new
            {
                message = "If the email is valid, a verification code has been sent."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // POST /api/email-verification/verify-otp
    [HttpPost("verify-otp")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyOtp([FromBody] EmailVerificationVerifyOtpRequest req, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            await _authService.VerifyEmailOtpAsync(req, ct);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

