package controllers

import (
    "strconv"
    "log"
    "net/http"
    "fmt"
    "os"
    "dms-backend/models"
    "dms-backend/services"
    "dms-backend/utils"
    "github.com/gin-gonic/gin"
)

type MemoController struct {
    memoService *services.MemoService
    pdfService  *services.PDFService
}

func NewMemoController() *MemoController {
    return &MemoController{
        memoService: services.NewMemoService(),
        pdfService:  services.NewPDFService(),
    }
}

func (c *MemoController) CreateMemo(ctx *gin.Context) {
    var req models.CreateMemoRequest
    if err := ctx.ShouldBindJSON(&req); err != nil {
        utils.BadRequestResponse(ctx, "Invalid request: "+err.Error())
        return
    }
    
    userID, _ := ctx.Get("user_id")
    memo, err := c.memoService.CreateMemo(req, userID.(string))
    if err != nil {
        log.Printf("Error creating memo: %v", err)
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    utils.CreatedResponse(ctx, "Memo created successfully", memo)
}

func (c *MemoController) GetMemoByID(ctx *gin.Context) {
    memoID := ctx.Param("id")
    if memoID == "" {
        utils.BadRequestResponse(ctx, "Memo ID is required")
        return
    }
    
    memo, err := c.memoService.GetMemoByID(memoID)
    if err != nil {
        utils.NotFoundResponse(ctx, err.Error())
        return
    }
    
    utils.SuccessResponse(ctx, "Memo retrieved successfully", memo)
}

func (c *MemoController) GetMemos(ctx *gin.Context) {
    log.Println("=== GetMemos called ===")
    
    role, _ := ctx.Get("role")
    userID, _ := ctx.Get("user_id")
    division, _ := ctx.Get("division")
    
    roleStr := role.(string)
    log.Printf("Role: %s, UserID: %s, Division: %v", roleStr, userID, division)
    
    limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "10"))
    offset, _ := strconv.Atoi(ctx.DefaultQuery("offset", "0"))
    
    var memos []*models.Memo
    var err error
    
    // SUPER ADMIN: Lihat SEMUA memo tanpa filter
    if roleStr == "super_admin" {
        log.Println("🌟 SUPER ADMIN: Getting ALL memos (no filter)")
        memos, err = c.memoService.GetAllMemos(limit, offset)
    } else if roleStr == "head_manager" {
        // HEAD MANAGER: Lihat memo sesuai divisi
        divisionStr := division.(string)
        log.Printf("📋 HEAD MANAGER: Getting memos for division: %s", divisionStr)
        memos, err = c.memoService.GetMemosByDivision(divisionStr, limit, offset)
    } else {
        // STAFF: Lihat memo sendiri
        log.Printf("👤 STAFF: Getting memos created by: %s", userID)
        memos, err = c.memoService.GetMemosByCreator(userID.(string), limit, offset)
    }
    
    if err != nil {
        log.Printf("❌ Error getting memos: %v", err)
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    if memos == nil {
        memos = []*models.Memo{}
    }
    
    log.Printf("✅ Returning %d memos", len(memos))
    utils.SuccessResponse(ctx, "Memos retrieved successfully", memos)
}

func (c *MemoController) ExportPDF(ctx *gin.Context) {
    memoID := ctx.Param("id")
    if memoID == "" {
        utils.BadRequestResponse(ctx, "Memo ID is required")
        return
    }
    
    log.Printf("Exporting PDF for memo: %s", memoID)
    
    filename, err := c.pdfService.GenerateMemoPDF(memoID)
    if err != nil {
        log.Printf("Error generating PDF: %v", err)
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    fileData, err := os.ReadFile(filename)
    if err != nil {
        log.Printf("Error reading PDF file: %v", err)
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    defer os.Remove(filename)
    
    ctx.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
    ctx.Header("Content-Type", "application/pdf")
    ctx.Header("Content-Length", strconv.Itoa(len(fileData)))
    
    ctx.Data(http.StatusOK, "application/pdf", fileData)
}

func (c *MemoController) ApproveMemo(ctx *gin.Context) {
    memoID := ctx.Param("id")
    if memoID == "" {
        utils.BadRequestResponse(ctx, "Memo ID is required")
        return
    }
    
    var req struct {
        Signature string `json:"signature"`
        Comments  string `json:"comments"`
    }
    
    if err := ctx.ShouldBindJSON(&req); err != nil {
        log.Printf("Error binding JSON: %v", err)
        utils.BadRequestResponse(ctx, "Invalid request: "+err.Error())
        return
    }
    
    userID, exists := ctx.Get("user_id")
    if !exists {
        utils.UnauthorizedResponse(ctx, "User not authenticated")
        return
    }
    
    userIDStr := userID.(string)
    log.Printf("Approving memo %s by user %s", memoID, userIDStr)
    
    err := c.memoService.ApproveMemo(memoID, userIDStr, req.Signature, req.Comments)
    if err != nil {
        log.Printf("Error approving memo: %v", err)
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    utils.SuccessResponse(ctx, "Memo approved successfully", nil)
}

func (c *MemoController) RejectMemo(ctx *gin.Context) {
    memoID := ctx.Param("id")
    if memoID == "" {
        utils.BadRequestResponse(ctx, "Memo ID is required")
        return
    }
    
    var req struct {
        Comments string `json:"comments"`
    }
    
    if err := ctx.ShouldBindJSON(&req); err != nil {
        utils.BadRequestResponse(ctx, "Invalid request: "+err.Error())
        return
    }
    
    userID, _ := ctx.Get("user_id")
    err := c.memoService.RejectMemo(memoID, userID.(string), req.Comments)
    if err != nil {
        log.Printf("Error rejecting memo: %v", err)
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    utils.SuccessResponse(ctx, "Memo rejected successfully", nil)
}

func (c *MemoController) DeleteMemo(ctx *gin.Context) {
    memoID := ctx.Param("id")
    if memoID == "" {
        utils.BadRequestResponse(ctx, "Memo ID is required")
        return
    }
    
    err := c.memoService.DeleteMemo(memoID)
    if err != nil {
        log.Printf("Error deleting memo: %v", err)
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    utils.SuccessResponse(ctx, "Memo deleted successfully", nil)
}

func (c *MemoController) GetPendingMemos(ctx *gin.Context) {
    role, _ := ctx.Get("role")
    division, _ := ctx.Get("division")
    
    var memos []*models.Memo
    var err error
    
    if role == "super_admin" {
        log.Println("🌟 SUPER ADMIN: Getting ALL pending memos")
        memos, err = c.memoService.GetAllPendingMemos()
    } else if role == "head_manager" {
        log.Printf("📋 HEAD MANAGER: Getting pending memos for division: %s", division)
        memos, err = c.memoService.GetMemosByStatus("pending", division.(string))
    } else {
        memos = []*models.Memo{}
        err = nil
    }
    
    if err != nil {
        log.Printf("Error getting pending memos: %v", err)
        utils.InternalServerErrorResponse(ctx, err)
        return
    }
    
    if memos == nil {
        memos = []*models.Memo{}
    }
    
    utils.SuccessResponse(ctx, "Pending memos retrieved successfully", memos)
}

func (c *MemoController) VerifyMemo(ctx *gin.Context) {
    memoID := ctx.Param("id")
    if memoID == "" {
        utils.BadRequestResponse(ctx, "Memo ID is required")
        return
    }
    
    memo, err := c.memoService.GetMemoByID(memoID)
    if err != nil {
        utils.NotFoundResponse(ctx, err.Error())
        return
    }
    
    utils.SuccessResponse(ctx, "Memo verified successfully", memo)
}

func (c *MemoController) ScanQRCode(ctx *gin.Context) {
    qrData := ctx.Query("qr_data")
    if qrData == "" {
        utils.BadRequestResponse(ctx, "QR data is required")
        return
    }
    
    memo, err := c.memoService.GetMemoByQRCode(qrData)
    if err != nil {
        utils.NotFoundResponse(ctx, "Memo not found for QR code")
        return
    }
    
    utils.SuccessResponse(ctx, "QR code scanned successfully", memo)
}
