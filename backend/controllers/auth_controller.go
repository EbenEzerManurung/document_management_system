package controllers

import (
    "dms-backend/models"
    "dms-backend/services"
    "dms-backend/utils"
    "github.com/gin-gonic/gin"
)

type AuthController struct {
    authService *services.AuthService
}

func NewAuthController() *AuthController {
    return &AuthController{
        authService: services.NewAuthService(),
    }
}

func (c *AuthController) Login(ctx *gin.Context) {
    var req models.LoginRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        utils.BadRequestResponse(ctx, "Invalid request: "+err.Error())
        return
    }
    
    token, user, err := c.authService.Login(req)
    if err != nil {
        utils.UnauthorizedResponse(ctx, err.Error())
        return
    }
    
    utils.SuccessResponse(ctx, "Login successful", gin.H{
        "token": token,
        "user":  user,
    })
}

func (c *AuthController) Register(ctx *gin.Context) {
    var req models.RegisterRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        utils.BadRequestResponse(ctx, "Invalid request: "+err.Error())
        return
    }
    
    user, err := c.authService.Register(req)
    if err != nil {
        utils.BadRequestResponse(ctx, err.Error())
        return
    }
    
    utils.CreatedResponse(ctx, "User registered successfully", user)
}

func (c *AuthController) GetProfile(ctx *gin.Context) {
    userID, exists := ctx.Get("user_id")
    if !exists {
        utils.UnauthorizedResponse(ctx, "User not authenticated")
        return
    }
    
    user, err := c.authService.GetUserByID(userID.(string))
    if err != nil {
        utils.NotFoundResponse(ctx, err.Error())
        return
    }
    
    utils.SuccessResponse(ctx, "Profile retrieved successfully", user)
}

func (c *AuthController) Logout(ctx *gin.Context) {
    utils.SuccessResponse(ctx, "Logged out successfully", nil)
}
