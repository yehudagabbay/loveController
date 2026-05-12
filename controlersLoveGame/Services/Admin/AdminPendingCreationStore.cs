using System.Collections.Concurrent;

namespace controlersLoveGame.Services.Admin
{
    public class AdminPendingCreationStore
    {
        private readonly ConcurrentDictionary<string, PendingAdminEntry> _entries = new();

        public string Create(string email, string passwordHash, string fullName, string role, TimeSpan ttl)
        {
            var token = Guid.NewGuid().ToString("N");

            _entries[email.Trim().ToLowerInvariant()] = new PendingAdminEntry
            {
                Token = token,
                PasswordHash = passwordHash,
                FullName = fullName,
                Role = role,
                ExpiresAtUtc = DateTime.UtcNow.Add(ttl)
            };

            return token;
        }

        public PendingAdminEntry? Consume(string email, string token)
        {
            var key = email.Trim().ToLowerInvariant();

            if (!_entries.TryGetValue(key, out var entry))
            {
                return null;
            }

            if (entry.ExpiresAtUtc < DateTime.UtcNow)
            {
                _entries.TryRemove(key, out _);
                return null;
            }

            if (!string.Equals(entry.Token, token, StringComparison.Ordinal))
            {
                return null;
            }

            _entries.TryRemove(key, out _);
            return entry;
        }

        public sealed class PendingAdminEntry
        {
            public string Token { get; set; } = string.Empty;
            public string PasswordHash { get; set; } = string.Empty;
            public string FullName { get; set; } = "Admin";
            public string Role { get; set; } = "Admin";
            public DateTime ExpiresAtUtc { get; set; }
        }
    }
}
