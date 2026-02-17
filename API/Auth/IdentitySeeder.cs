using Microsoft.AspNetCore.Identity;
using CalculatorDomainDemo.Domain;

public static class IdentitySeeder
{
    public static async Task SeedAsync(UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole> roleManager)
    {
        string[] roles = { "Admin", "Manager", "User" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        await SeedUserAsync(userManager, "Skye", "Skye@Calculator.com", "Skye123!", "Admin");
        await SeedUserAsync(userManager, "Manager1", "Manager1@Calculator.com", "Manager123!", "Manager");
        await SeedUserAsync(userManager, "User1", "User1@Calculator.com", "User123!", "User");
    }

    private static async Task SeedUserAsync(UserManager<ApplicationUser> userManager,
        string username, string email, string password, string role)
    {
        var user = await userManager.FindByNameAsync(username);
        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = username,
                Email = email
            };

            await userManager.CreateAsync(user, password);
            await userManager.AddToRoleAsync(user, role);
        }
    }
}