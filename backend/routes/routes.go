package routes

import (
    "dms-backend/controllers"
    "dms-backend/middleware"
    "github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine) {
    authController := controllers.NewAuthController()
    memoController := controllers.NewMemoController()
    userController := controllers.NewUserController()
    
    // Public routes
    public := router.Group("/api/v1")
    {
        public.POST("/auth/login", authController.Login)
        public.POST("/auth/register", authController.Register)
    }
    
    // Protected routes
    protected := router.Group("/api/v1")
    protected.Use(middleware.AuthMiddleware())
    {
        // Auth routes
        protected.GET("/auth/profile", authController.GetProfile)
        protected.POST("/auth/logout", authController.Logout)
        
        // User routes
        protected.GET("/users/profile", userController.GetProfile)
        protected.PUT("/users/profile", userController.UpdateProfile)
        protected.PUT("/users/profile-image", userController.UpdateProfileImage)
        protected.PUT("/users/signature", userController.UpdateSignature)
        protected.PUT("/users/change-password", userController.ChangePassword)
        protected.GET("/users/division/:division", userController.GetUsersByDivision)
        protected.GET("/users/:id", userController.GetUserByID)
        protected.PUT("/users/:id/deactivate", userController.DeactivateUser)
        protected.PUT("/users/:id/activate", userController.ActivateUser)
        
        // Memo routes - semua user bisa akses, filter by role di controller
        memoRoutes := protected.Group("/memos")
        {
            memoRoutes.POST("/", memoController.CreateMemo)
            memoRoutes.GET("/", memoController.GetMemos)
            memoRoutes.GET("/:id", memoController.GetMemoByID)
            memoRoutes.GET("/:id/export", memoController.ExportPDF)
            memoRoutes.DELETE("/:id", memoController.DeleteMemo)
            memoRoutes.GET("/verify/:id", memoController.VerifyMemo)
            memoRoutes.GET("/scan-qr", memoController.ScanQRCode)
        }
        
        // Pending approval - Super Admin dan Head Manager
        pendingRoutes := protected.Group("/memos")
        pendingRoutes.Use(middleware.RoleMiddleware("super_admin", "head_manager"))
        {
            pendingRoutes.GET("/pending", memoController.GetPendingMemos)
            pendingRoutes.PUT("/:id/approve", memoController.ApproveMemo)
            pendingRoutes.PUT("/:id/reject", memoController.RejectMemo)
        }
    }
}
