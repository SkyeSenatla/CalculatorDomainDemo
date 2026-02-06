using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;

namespace API.Controllers
{
   
    [ApiController]

    // Base route for all authentication-related endpoints.

    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        // UserManager is provided by ASP.NET Core Identity.
        // It encapsulates all user-related operations such as:
        // - Finding users
        // - Verifying passwords
        // - Retrieving roles
        //
        // We NEVER access the user database directly.
        private readonly UserManager<ApplicationUser> _userManager;

        // TokenService is our own service responsible for:
        // - Creating JWT tokens
        // - Adding claims (user id, roles, etc.)
        // - Signing the token securely
        //
        // Controllers should not generate tokens themselves.
        private readonly TokenService _tokenService;

        // Dependencies are injected via constructor injection.
        // This keeps the controller:
        // - Testable
        // - Thin
        // - Focused on orchestration only
        public AuthController(
            UserManager<ApplicationUser> userManager,
            TokenService tokenService)
        {
            _userManager = userManager;
            _tokenService = tokenService;
        }

        // This endpoint handles user authentication (login).
        //
        // POST /api/auth/login
        //
        // We use POST because:
        // - Credentials are being sent
 
        // - Sensitive data should not appear in URLs
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            // Attempt to find the user by username.
            // If the user does not exist, this returns null.
            var user = await _userManager.FindByNameAsync(dto.Username);

            // We intentionally combine both failure cases:
            // - User does not exist
            // - Password is incorrect
            //
            // This avoids leaking information about which part failed,
            // which is an important security practice.
            if (user == null || 
                !await _userManager.CheckPasswordAsync(user, dto.Password))
            {
                // 401 Unauthorized indicates authentication failure.
                // The client is not trusted at this point.
                return Unauthorized();
            }

            // If authentication succeeds, retrieve the user's roles.
            // These roles will later be embedded into the JWT
            // and used by the authorization system.
            var roles = await _userManager.GetRolesAsync(user);

            // Generate a JWT token containing:
            // - User identity
            // - Role claims
            // - Expiry information
            //
            // Token creation is delegated to a service
            // to keep the controller simple.
            var token = _tokenService.GenerateToken(user, roles);

            // Return the token to the client.
            // The client is responsible for storing and sending
            // this token with future requests.
            return Ok(new { token });
        }
    }
}
