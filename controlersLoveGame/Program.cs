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
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          // עדכון ה-Origin להתאים לשרת הפיתוח של React Native
                          policy.WithOrigins("http://10.0.2.2:8081", "http://192.168.1.197:8081")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
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
app.UseCors(MyAllowSpecificOrigins);

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

// קישור לכל הממשקים (0.0.0.0) במקום localhost בלבד
app.Run("http://0.0.0.0:7279");