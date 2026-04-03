namespace AGMS.Application.DTOs.Category;

public class PagedCategoryResponse
{
    public IEnumerable<CategoryResponse> Items { get; set; } = new List<CategoryResponse>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)System.Math.Ceiling((double)TotalCount / PageSize) : 0;
}
