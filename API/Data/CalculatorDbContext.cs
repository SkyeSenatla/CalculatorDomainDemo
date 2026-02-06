using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
public class CalculatorDbContext : IdentityDbContext<ApplicationUser>
{
    public CalculatorDbContext(DbContextOptions<CalculatorDbContext> options)
    :base(options)
    {
    
    }
    
}