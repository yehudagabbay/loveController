using Microsoft.AspNetCore.Mvc;

namespace controlersLoveGame.Controllers
{
    [ApiController]
    [Route("api/server-time")]
    public class ServerTimeController : ControllerBase
    {
        [HttpGet]
        public ContentResult Get()
        {
            var utcNow = DateTimeOffset.UtcNow;
            var israelNow = TimeZoneInfo.ConvertTime(utcNow, GetIsraelTimeZone());
            var serverNow = DateTimeOffset.Now;

            var text =
                "LoveGame server time check" + Environment.NewLine +
                $"Israel time: {israelNow:yyyy-MM-dd HH:mm:ss.fff zzz}" + Environment.NewLine +
                $"UTC time: {utcNow:yyyy-MM-dd HH:mm:ss.fff zzz}" + Environment.NewLine +
                $"Server local time: {serverNow:yyyy-MM-dd HH:mm:ss.fff zzz}";

            return Content(text, "text/plain; charset=utf-8");
        }

        private static TimeZoneInfo GetIsraelTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Israel Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Asia/Jerusalem");
            }
        }
    }
}
