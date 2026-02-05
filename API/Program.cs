using System.Reflection;
using CalculatorDomain.Logic;
using CalculatorDomain.Persistence;
using CalculatorDomainDemo.Persistence;

var builder = WebApplication.CreateBuilder(args);

var dataDirectory = Path.Combine(
    builder.Environment.ContentRootPath,
    "Data"
);

builder.Services.AddSingleton<ICalculationStore>(
    new FileCalculationStore(dataDirectory)
);

// Add services to the container.
builder.Services.AddControllers(); //tells ASP.NET that this application will use controllers as entry points
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<ICalculationStore>(
    new FileCalculationStore(dataDirectory)
);
builder.Services.AddSingleton<CalculatorService>();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.MapControllers(); 

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();



app.Run();


