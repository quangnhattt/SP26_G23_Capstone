using AGMS.Application.Contracts;
using AGMS.Application.DTOs.Symptoms;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers;

[ApiController]
[Route("api/symptoms")]
public class SymptomsController : ControllerBase
{
    private readonly ISymptomService _symptomService;

    public SymptomsController(ISymptomService symptomService)
    {
        _symptomService = symptomService;
    }

    // GET /api/symptoms - danh sách triệu chứng cho khách chọn khi đặt lịch
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<SymptomDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var items = await _symptomService.GetAllAsync(ct);
        return Ok(items);
    }
}

