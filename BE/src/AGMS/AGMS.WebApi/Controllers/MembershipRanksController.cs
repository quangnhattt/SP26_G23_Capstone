using AGMS.Application.Contracts;
using AGMS.Application.DTOs.MembershipRank;
using Microsoft.AspNetCore.Mvc;

namespace AGMS.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MembershipRanksController : ControllerBase
    {
        private readonly IMembershipRankService _membershipRankService;

        public MembershipRanksController(IMembershipRankService membershipRankService)
        {
            _membershipRankService = membershipRankService;
        }

        [HttpGet]
        public async Task<IActionResult> GetRanks([FromQuery] MembershipRankFilterDto filter)
        {
            var result = await _membershipRankService.GetRanksAsync(filter);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRankById(int id)
        {
            var rank = await _membershipRankService.GetRankByIdAsync(id);
            if (rank == null)
            {
                return NotFound(new { message = "MSG_MR07: Membership Rank not found." });
            }
            return Ok(rank);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRank([FromBody] CreateMembershipRankRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _membershipRankService.CreateRankAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }

            return CreatedAtAction(nameof(GetRankById), new { id = result.Data!.RankID }, result.Data);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRank(int id, [FromBody] UpdateMembershipRankRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _membershipRankService.UpdateRankAsync(id, request);
            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }

        [HttpPatch("{id}/activate")]
        public async Task<IActionResult> ActivateRank(int id)
        {
            var result = await _membershipRankService.ChangeStatusAsync(id, true);
            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }
            return Ok(new { message = result.Message });
        }

        [HttpPatch("{id}/deactivate")]
        public async Task<IActionResult> DeactivateRank(int id)
        {
            var result = await _membershipRankService.ChangeStatusAsync(id, false);
            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }
            return Ok(new { message = result.Message });
        }
    }
}