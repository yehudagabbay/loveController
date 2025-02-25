using controlersLoveGame.Data;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// הגדרת חיבור למסד נתונים
builder.Services.AddDbContext<LoveGameDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// הוספת בקרות API ו-Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// הוספת תמיכה ב-CORS
builder.Services.AddCors(opt =>
{
    opt.AddPolicy("CorsPolicy", policy =>
    {
        policy
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
    .WithOrigins("http://localhost:8081");
    });
});

var app = builder.Build();

// אתחול Firebase
FirebaseApp.Create(new AppOptions()
{
    Credential = GoogleCredential.FromFile("service-account.json")
});

// הגדרות ב-Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// הפעלת CORS
app.UseCors("CorsPolicy");

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// הרצת האפליקציה
app.Run();
