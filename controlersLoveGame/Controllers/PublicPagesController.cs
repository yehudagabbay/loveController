using Microsoft.AspNetCore.Mvc;

namespace controlersLoveGame.Controllers;

[ApiController]
[Route("")]
public class PublicPagesController : ControllerBase
{
    [HttpGet("support")]
    public IActionResult SupportPage()
    {
        return Redirect("/support.html");
    }
}
