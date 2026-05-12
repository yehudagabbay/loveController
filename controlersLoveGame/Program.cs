using controlersLoveGame.Data;
using controlersLoveGame.Models;
using controlersLoveGame.Services;
using controlersLoveGame.Services.Admin;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: true);

builder.Services.AddDbContext<LoveGameDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<SubscriptionService>();
builder.Services.AddScoped<AdminAuthEmailService>();
builder.Services.AddSingleton<AdminSessionTokenService>();
builder.Services.AddSingleton<AdminPasswordResetStore>();
builder.Services.AddSingleton<AdminPendingCreationStore>();

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("CorsPolicy", policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .SetIsOriginAllowed(origin =>
            {
                if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                {
                    return false;
                }

                return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                    || uri.Host.Equals("127.0.0.1")
                    || uri.Host.Equals("libaadmin.somee.com", StringComparison.OrdinalIgnoreCase)
                    || uri.Host.Equals("libagame.somee.com", StringComparison.OrdinalIgnoreCase)
                    || uri.Host.Equals("lovegame.somee.com", StringComparison.OrdinalIgnoreCase);
            });
    });
});

var app = builder.Build();

if (FirebaseApp.DefaultInstance == null)
{
    var configuredFirebasePath = builder.Configuration["Firebase:CredentialPath"];
    var firebasePathCandidates = new[]
    {
        configuredFirebasePath,
        "service-account.json"
    }
    .Where(path => !string.IsNullOrWhiteSpace(path))
    .Select(path => Path.IsPathRooted(path!)
        ? path!
        : Path.Combine(builder.Environment.ContentRootPath, path!))
    .Distinct()
    .ToList();

    var firebaseCredentialPath = firebasePathCandidates.FirstOrDefault(File.Exists);

    if (firebaseCredentialPath == null)
    {
        throw new FileNotFoundException(
            "Firebase service account file was not found. Configure Firebase:CredentialPath in appsettings.Secrets.json or place the file in the default location.",
            configuredFirebasePath ?? "service-account.json");
    }

    FirebaseApp.Create(new AppOptions
    {
        Credential = GoogleCredential.FromFile(firebaseCredentialPath)
    });
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("CorsPolicy");

app.UseHttpsRedirection();
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value ?? string.Empty;
    bool isProtectedAdminRoute =
        path.StartsWith("/api/Admin", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(path, "/api/Admin/login", StringComparison.OrdinalIgnoreCase) &&
        !string.Equals(path, "/api/Admin/create-admin", StringComparison.OrdinalIgnoreCase);

    bool isProtectedUsersRoute =
        (HttpMethods.IsGet(context.Request.Method) && string.Equals(path, "/api/Users", StringComparison.OrdinalIgnoreCase)) ||
        (HttpMethods.IsDelete(context.Request.Method) && path.StartsWith("/api/Users/", StringComparison.OrdinalIgnoreCase)) ||
        (HttpMethods.IsPost(context.Request.Method) && string.Equals(path, "/api/Users/reset-password", StringComparison.OrdinalIgnoreCase)) ||
        (HttpMethods.IsGet(context.Request.Method) && path.StartsWith("/api/Users/favorite-cards/", StringComparison.OrdinalIgnoreCase)) ||
        (HttpMethods.IsGet(context.Request.Method) && path.StartsWith("/api/Users/liked-cards/", StringComparison.OrdinalIgnoreCase)) ||
        (HttpMethods.IsGet(context.Request.Method) && path.StartsWith("/api/Users/completed-cards/", StringComparison.OrdinalIgnoreCase));

    if (!isProtectedAdminRoute && !isProtectedUsersRoute)
    {
        await next();
        return;
    }

    var authHeader = context.Request.Headers.Authorization.ToString();
    if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsync("Admin session token is required.");
        return;
    }

    var token = authHeader.Substring("Bearer ".Length).Trim();
    if (string.IsNullOrWhiteSpace(token))
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsync("Admin session token is required.");
        return;
    }

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<LoveGameDbContext>();
    var tokenService = scope.ServiceProvider.GetRequiredService<AdminSessionTokenService>();
    var tokenHash = tokenService.HashToken(token);

    var session = await db.AdminSessions
        .Include(s => s.Admin)
        .FirstOrDefaultAsync(s =>
            s.TokenHash == tokenHash &&
            s.IsActive &&
            s.ExpiresAt > DateTime.UtcNow);

    if (session?.Admin == null || !session.Admin.IsActive)
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsync("Admin session is invalid or expired.");
        return;
    }

    context.Items["AdminSessionId"] = session.SessionId;
    context.Items["AdminId"] = session.AdminId;
    context.Items["AdminEmail"] = session.Admin.Email;

    await next();
});
app.UseAuthorization();
app.MapControllers();

app.Run();
