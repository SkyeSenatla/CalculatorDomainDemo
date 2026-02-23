using CalculatorDomainDemo;
using CalculatorDomainDemo.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
namespace CalculatorDomainDemo.Persistence;

public class CalculatorDbContext
    : IdentityDbContext<ApplicationUser, IdentityRole, string>
{
    public CalculatorDbContext(DbContextOptions<CalculatorDbContext> options)
        : base(options)
    {
    }

    public DbSet<Calculation> Calculations { get; set; }
    public DbSet<ApplicationUser> Users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<Calculation>()
            .ToTable("Calculation")
            .HasKey(c => c.Id);

        //Configure relationship
       modelBuilder.Entity<Calculation>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }

}
