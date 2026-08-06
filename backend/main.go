package main

import (
    "log"
    "dms-backend/config"
    "dms-backend/database"
    "dms-backend/routes"
    "github.com/gin-gonic/gin"
    "github.com/gin-contrib/cors"
)

func main() {
    cfg := config.LoadConfig()
    
    if err := database.Connect(); err != nil {
        log.Fatal("Failed to connect to database:", err)
    }
    defer database.Close()
    
    if gin.Mode() == gin.ReleaseMode {
        gin.SetMode(gin.ReleaseMode)
    }
    router := gin.Default()
    
    // Serve static files
    router.Static("/uploads", "./uploads")
    
    // CORS configuration
    router.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"},
        AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
        ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
        AllowCredentials: true,
        MaxAge:           12 * 60 * 60,
    }))
    
    routes.SetupRoutes(router)
    
    log.Printf("Server starting on port %s", cfg.Port)
    if err := router.Run(":" + cfg.Port); err != nil {
        log.Fatal("Failed to start server:", err)
    }
}
