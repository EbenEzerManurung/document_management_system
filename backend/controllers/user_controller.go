package controllers

import (
    "log"
    "dms-backend/models"
    "dms-backend/services"
    "dms-backend/utils"
    "github.com/gin-gonic/gin"
)

type UserController struct {
    userService *services.UserService
}

func NewUserController() *UserController {
    return &UserController{
        userService: services.NewUserService(),
    }
}

func (c *UserController) GetProfile(ctx *gin.Context) {
    userID, exists := ctx.Get("user_id")
    if !exists {
        utils.UnauthorizedResponse(ctx, "User not authenticated")
        return
    }
    
    user, err := c.userService.GetUserByID(userID.(string))
    if err != nil {
        utils.NotFoundResponse(ctx, err.Error())
        return
    }
    
    response := map[string]interface{}{
        "id":                user.ID,
        "username":          user.Username,
        "email":             user.Email,
        "full_name":         user.FullName,
        "division":          user.Division,
        "role":              user.Role,
        "profile_image":     user.ProfileImage.String,
        "digital_signature": user.DigitalSignature.String,
        "is_active":         user.IsActive,
        "created_at":        user.CreatedAt,
        "updated_at":        user.UpdatedAt,
    }
    
    utils.SuccessResponse(ctx, "Profile retrieved successfully", response)
}

func (c *UserController) UpdateProfile(ctx *gin.Context) {
    userID, exists := ctx.Get("user_id")
    if !exists {
        utils.UnauthorizedResponse(ctx, "User not authenticated")
        return
    }
    
    var req models.UpdateUserRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        utils.BadRequestResponse(ctx, "Invalid request: "+err.Error())
        return
    }
    
    user, err := c.userService.UpdateProfile(userID.(string), req)
    if err != nil {
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    response := map[string]interface{}{
        "id":                user.ID,
        "username":          user.Username,
        "email":             user.Email,
        "full_name":         user.FullName,
        "division":          user.Division,
        "role":              user.Role,
        "profile_image":     user.ProfileImage.String,
        "digital_signature": user.DigitalSignature.String,
        "is_active":         user.IsActive,
        "created_at":        user.CreatedAt,
        "updated_at":        user.UpdatedAt,
    }
    
    utils.SuccessResponse(ctx, "Profile updated successfully", response)
}

func (c *UserController) UpdateProfileImage(ctx *gin.Context) {
    userID, exists := ctx.Get("user_id")
    if !exists {
        log.Println("User not authenticated")
        utils.UnauthorizedResponse(ctx, "User not authenticated")
        return
    }
    
    var req models.UpdateProfileImageRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        log.Printf("Error binding JSON: %v", err)
        utils.BadRequestResponse(ctx, "Invalid request: "+err.Error())
        return
    }
    
    log.Printf("Updating profile image for user: %s", userID.(string))
    log.Printf("Image data length: %d", len(req.ProfileImage))
    
    if len(req.ProfileImage) == 0 {
        log.Println("Empty image data")
        utils.BadRequestResponse(ctx, "Image data is empty")
        return
    }
    
    if len(req.ProfileImage) > 5*1024*1024 {
        log.Println("Image too large")
        utils.BadRequestResponse(ctx, "Image too large, max 5MB")
        return
    }
    
    err := c.userService.UpdateProfileImage(userID.(string), req.ProfileImage)
    if err != nil {
        log.Printf("Error updating profile image: %v", err)
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    log.Println("Profile image updated successfully")
    utils.SuccessResponse(ctx, "Profile image updated successfully", nil)
}

func (c *UserController) UpdateSignature(ctx *gin.Context) {
    userID, exists := ctx.Get("user_id")
    if !exists {
        utils.UnauthorizedResponse(ctx, "User not authenticated")
        return
    }
    
    var req models.UpdateSignatureRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        utils.BadRequestResponse(ctx, "Invalid request: "+err.Error())
        return
    }
    
    err := c.userService.UpdateSignature(userID.(string), req.DigitalSignature)
    if err != nil {
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    utils.SuccessResponse(ctx, "Digital signature updated successfully", nil)
}

func (c *UserController) ChangePassword(ctx *gin.Context) {
    userID, exists := ctx.Get("user_id")
    if !exists {
        utils.UnauthorizedResponse(ctx, "User not authenticated")
        return
    }
    
    var req models.ChangePasswordRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        utils.BadRequestResponse(ctx, "Invalid request: "+err.Error())
        return
    }
    
    err := c.userService.ChangePassword(userID.(string), req.OldPassword, req.NewPassword)
    if err != nil {
        utils.BadRequestResponse(ctx, err.Error())
        return
    }
    
    utils.SuccessResponse(ctx, "Password changed successfully", nil)
}

func (c *UserController) GetUsersByDivision(ctx *gin.Context) {
    division := ctx.Param("division")
    if division == "" {
        utils.BadRequestResponse(ctx, "Division is required")
        return
    }
    
    role, _ := ctx.Get("role")
    var users []*models.User
    var err error
    
    // Super admin bisa melihat semua user dari semua divisi
    if role == "super_admin" {
        log.Println("✅ Super Admin: Getting ALL users")
        users, err = c.userService.GetAllUsers()
    } else {
        // Head manager/staff hanya melihat divisinya
        users, err = c.userService.GetUsersByDivision(division)
    }
    
    if err != nil {
        log.Printf("Error getting users: %v", err)
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    response := make([]map[string]interface{}, len(users))
    for i, user := range users {
        response[i] = map[string]interface{}{
            "id":                user.ID,
            "username":          user.Username,
            "email":             user.Email,
            "full_name":         user.FullName,
            "division":          user.Division,
            "role":              user.Role,
            "profile_image":     user.ProfileImage.String,
            "digital_signature": user.DigitalSignature.String,
            "is_active":         user.IsActive,
            "created_at":        user.CreatedAt,
            "updated_at":        user.UpdatedAt,
        }
    }
    
    log.Printf("✅ Returning %d users", len(response))
    utils.SuccessResponse(ctx, "Users retrieved successfully", response)
}

func (c *UserController) DeactivateUser(ctx *gin.Context) {
    userID := ctx.Param("id")
    if userID == "" {
        utils.BadRequestResponse(ctx, "User ID is required")
        return
    }
    
    err := c.userService.DeactivateUser(userID)
    if err != nil {
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    utils.SuccessResponse(ctx, "User deactivated successfully", nil)
}

func (c *UserController) ActivateUser(ctx *gin.Context) {
    userID := ctx.Param("id")
    if userID == "" {
        utils.BadRequestResponse(ctx, "User ID is required")
        return
    }
    
    err := c.userService.ActivateUser(userID)
    if err != nil {
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    utils.SuccessResponse(ctx, "User activated successfully", nil)
}

func (c *UserController) GetUserByID(ctx *gin.Context) {
    userID := ctx.Param("id")
    if userID == "" {
        utils.BadRequestResponse(ctx, "User ID is required")
        return
    }
    
    user, err := c.userService.GetUserByID(userID)
    if err != nil {
        utils.NotFoundResponse(ctx, err.Error())
        return
    }
    
    response := map[string]interface{}{
        "id":                user.ID,
        "username":          user.Username,
        "email":             user.Email,
        "full_name":         user.FullName,
        "division":          user.Division,
        "role":              user.Role,
        "profile_image":     user.ProfileImage.String,
        "digital_signature": user.DigitalSignature.String,
        "is_active":         user.IsActive,
        "created_at":        user.CreatedAt,
        "updated_at":        user.UpdatedAt,
    }
    
    utils.SuccessResponse(ctx, "User retrieved successfully", response)
}
