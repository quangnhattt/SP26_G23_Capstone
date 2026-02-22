using AGMS.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Bật lại kết nối Database (Hãy chắc chắn trong appsettings.json bạn đã đổi Server=. nhé)
builder.Services.AddInfrastructure(builder.Configuration);

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Tạm thời tắt HTTPS Redirection để tránh lỗi cảnh báo màu vàng khi chạy HTTP local
// app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// LỆNH QUAN TRỌNG NHẤT: Ép buộc tuyệt đối App phải chạy ở cổng 5259.
// Lệnh này ở cuối cùng sẽ ghi đè lên mọi cài đặt ngầm đang cố chiếm cổng 5000.
app.Run("http://localhost:5259");