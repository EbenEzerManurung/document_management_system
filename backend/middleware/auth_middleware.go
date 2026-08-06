package middleware

import (
    "strings"
    "log"
    "dms-backend/database"
    "dms-backend/utils"
    "github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            utils.UnauthorizedResponse(c, "Authorization header is required")
            c.Abort()
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
            utils.UnauthorizedResponse(c, "Invalid authorization header format")
            c.Abort()
            return
        }

        tokenString := parts[1]
        claims, err := utils.ValidateToken(tokenString)
        if err != nil {
            utils.UnauthorizedResponse(c, "Invalid or expired token")
            c.Abort()
            return
        }

        // Get user from database
        db := database.GetDB()
        var userID, userEmail, userDivision, userRole string
        err = db.QueryRow(`
            SELECT id, email, division, role 
            FROM users 
            WHERE email = ? AND is_active = 1
        `, claims.Email).Scan(&userID, &userEmail, &userDivision, &userRole)
        
        if err != nil {
            log.Printf("❌ User not found with email: %s, error: %v", claims.Email, err)
            utils.UnauthorizedResponse(c, "User not found")
            c.Abort()
            return
        }

        log.Printf("✅ User authenticated: ID=%s, Email=%s, Division=%s, Role=%s", 
            userID, userEmail, userDivision, userRole)

        // Set all user info in context
        c.Set("user_id", userID)
        c.Set("email", userEmail)
        c.Set("division", userDivision)
        c.Set("role", userRole)

        c.Next()
    }
}

func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        role, exists := c.Get("role")
        if !exists {
            utils.UnauthorizedResponse(c, "Role not found")
            c.Abort()
            return
        }

        roleStr, ok := role.(string)
        if !ok {
            utils.UnauthorizedResponse(c, "Invalid role type")
            c.Abort()
            return
        }

        // Super Admin has access to everything
        if roleStr == "super_admin" {
            c.Next()
            return
        }

        for _, allowedRole := range allowedRoles {
            if roleStr == allowedRole {
                c.Next()
                return
            }
        }

        utils.UnauthorizedResponse(c, "Insufficient permissions")
        c.Abort()
    }
}
