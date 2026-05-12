using System.Collections.Concurrent;

namespace controlersLoveGame.Services.Admin
{
    public class AdminPasswordResetStore
    {
        private readonly ConcurrentDictionary<string, ResetEntry> _entries = new();

        public string Create(string email, TimeSpan ttl)
        {
            var token = Guid.NewGuid().ToString("N");
            _entries[email.Trim().ToLowerInvariant()] = new ResetEntry
            {
                Token = token,
                ExpiresAtUtc = DateTime.UtcNow.Add(ttl)
            };

            return token;
        }

        public bool Validate(string email, string token)
        {
            var key = email.Trim().ToLowerInvariant();
            if (!_entries.TryGetValue(key, out var entry))
            {
                return false;
            }

            if (entry.ExpiresAtUtc < DateTime.UtcNow)
            {
                _entries.TryRemove(key, out _);
                return false;
            }

            return string.Equals(entry.Token, token, StringComparison.Ordinal);
        }

        public void Consume(string email)
        {
            _entries.TryRemove(email.Trim().ToLowerInvariant(), out _);
        }

        private sealed class ResetEntry
        {
            public string Token { get; set; } = string.Empty;
            public DateTime ExpiresAtUtc { get; set; }
        }
    }
}
