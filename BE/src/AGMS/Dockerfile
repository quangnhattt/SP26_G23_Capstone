# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution file
COPY AGMS.sln ./

# Copy all project files
COPY AGMS.Application/AGMS.Application.csproj AGMS.Application/
COPY AGMS.Domain/AGMS.Domain.csproj AGMS.Domain/
COPY AGMS.Infrastructure/AGMS.Infrastructure.csproj AGMS.Infrastructure/
COPY AGMS.WebApi/AGMS.WebApi.csproj AGMS.WebApi/

# Restore dependencies
RUN dotnet restore

# Copy all source code
COPY . .

# Build the application
WORKDIR /src/AGMS.WebApi
RUN dotnet build -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
EXPOSE 8081
 
# Copy published files
COPY --from=publish /app/publish .

# Set environment variable to listen on all interfaces (IPv4 + IPv6)
ENV ASPNETCORE_URLS=http://0.0.0.0:8080

ENTRYPOINT ["dotnet", "AGMS.WebApi.dll"]
