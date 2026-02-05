using System.Net; 
using System.Text.Json;


public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;  // call the function that will process this http request  
    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response; 
        response.ContentType = "application/json";

        response.StatusCode = exception switch
        {
            InvalidCalculationException => StatusCodes.Status422UnprocessableEntity,
            _ => StatusCodes.Status500InternalServerError
            
        };

        var payload = new
        {
            error = exception.GetType().Name,
            detail = exception.Message
        }; 

        return response.WriteAsync(JsonSerializer.Serialize(payload)); 
    }

    public ExceptionHandlingMiddleware(RequestDelegate next) // pass the function to the middleware 
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context) //context = request / response
    {
        try
        {
            await _next(context);

        }
        catch(Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        } 
    }
} 