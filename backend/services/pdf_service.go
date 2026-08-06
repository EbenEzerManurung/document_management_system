package services

import (
    "fmt"
    "strings"
    "os"
    "dms-backend/database"
    "dms-backend/models"
    "github.com/jung-kurt/gofpdf"
    "github.com/skip2/go-qrcode"
)

type PDFService struct{}

func NewPDFService() *PDFService {
    return &PDFService{}
}

func (s *PDFService) GenerateMemoPDF(memoID string) (string, error) {
    db := database.GetDB()
    
    var memo models.Memo
    query := `SELECT id, memo_number, title, content, division, status, created_by, approved_by, approved_at, qr_code, file_path, created_at, updated_at 
              FROM memos WHERE id = ?`
    
    err := db.QueryRow(query, memoID).Scan(
        &memo.ID, &memo.MemoNumber, &memo.Title, &memo.Content,
        &memo.Division, &memo.Status, &memo.CreatedBy, &memo.ApprovedBy,
        &memo.ApprovedAt, &memo.QRCode, &memo.FilePath,
        &memo.CreatedAt, &memo.UpdatedAt,
    )
    if err != nil {
        return "", err
    }
    
    var creator models.User
    err = db.QueryRow(`SELECT full_name, email, division FROM users WHERE id = ?`, memo.CreatedBy).Scan(
        &creator.FullName, &creator.Email, &creator.Division,
    )
    if err != nil {
        creator.FullName = "Unknown"
        creator.Email = "unknown@company.com"
        creator.Division = memo.Division
    }
    
    var approverName string = "-"
    if memo.ApprovedBy.Valid && memo.ApprovedBy.String != "" {
        err = db.QueryRow(`SELECT full_name FROM users WHERE id = ?`, memo.ApprovedBy.String).Scan(
            &approverName,
        )
        if err != nil {
            approverName = "-"
        }
    }
    
    // Generate QR Code
    qrURL := fmt.Sprintf("http://localhost:3000/memos/%s", memo.ID)
    qrPath := fmt.Sprintf("qr_%s.png", memo.ID[:8])
    
    err = qrcode.WriteFile(qrURL, qrcode.Medium, 150, qrPath)
    if err != nil {
        return "", err
    }
    defer os.Remove(qrPath)
    
    pdf := gofpdf.New("P", "mm", "A4", "")
    pdf.SetMargins(25, 18, 25)
    pdf.AddPage()
    
    // ==================== HEADER ====================
    pdf.SetFont("Arial", "B", 20)
    pdf.SetTextColor(0, 0, 0)
    pdf.Cell(0, 12, "MEMO")
    pdf.Ln(8)
    
    pdf.SetDrawColor(200, 200, 200)
    pdf.SetLineWidth(0.3)
    pdf.Line(25, pdf.GetY(), 185, pdf.GetY())
    pdf.Ln(8)
    
    // ==================== INFO ====================
    pdf.SetFont("Arial", "B", 9)
    pdf.SetTextColor(80, 80, 80)
    pdf.Cell(30, 5.5, "MEMO NO.")
    pdf.SetFont("Arial", "", 9)
    pdf.SetTextColor(0, 0, 0)
    pdf.Cell(70, 5.5, memo.MemoNumber)
    
    pdf.SetFont("Arial", "B", 9)
    pdf.SetTextColor(80, 80, 80)
    pdf.Cell(18, 5.5, "DATE")
    pdf.SetFont("Arial", "", 9)
    pdf.SetTextColor(0, 0, 0)
    pdf.Cell(0, 5.5, memo.CreatedAt.Format("02 Jan 2006"))
    pdf.Ln(6)
    
    pdf.SetFont("Arial", "B", 9)
    pdf.SetTextColor(80, 80, 80)
    pdf.Cell(25, 5.5, "FROM")
    pdf.SetFont("Arial", "", 9)
    pdf.SetTextColor(0, 0, 0)
    pdf.Cell(0, 5.5, fmt.Sprintf("%s Department", creator.Division))
    pdf.Ln(5.5)
    
    pdf.SetFont("Arial", "B", 9)
    pdf.SetTextColor(80, 80, 80)
    pdf.Cell(25, 5.5, "TO")
    pdf.SetFont("Arial", "", 9)
    pdf.SetTextColor(0, 0, 0)
    pdf.Cell(0, 5.5, fmt.Sprintf("Head of %s Department", memo.Division))
    pdf.Ln(5.5)
    
    pdf.SetFont("Arial", "B", 9)
    pdf.SetTextColor(80, 80, 80)
    pdf.Cell(25, 5.5, "CC")
    pdf.SetFont("Arial", "", 9)
    pdf.SetTextColor(0, 0, 0)
    pdf.Cell(0, 5.5, "Board of Directors")
    pdf.Ln(5.5)
    
    pdf.SetFont("Arial", "B", 9)
    pdf.SetTextColor(80, 80, 80)
    pdf.Cell(25, 5.5, "SUBJECT")
    pdf.SetFont("Arial", "", 9)
    pdf.SetTextColor(0, 0, 0)
    pdf.Cell(0, 5.5, memo.Title)
    pdf.Ln(8)
    
    // ==================== TABLE ====================
    infoData := [][]string{
        {"PRIORITY", "HIGH"},
        {"CATEGORY", strings.ToUpper(memo.Division)},
        {"REFERENCE", memo.MemoNumber},
        {"PAGES", "1 of 1"},
        {"ATTACHMENT", "Memo_Attachment.pdf"},
    }
    
    for i, row := range infoData {
        if i%2 == 0 {
            pdf.SetFillColor(248, 248, 248)
        } else {
            pdf.SetFillColor(255, 255, 255)
        }
        
        pdf.SetFont("Arial", "B", 8)
        pdf.SetTextColor(80, 80, 80)
        pdf.CellFormat(35, 5, row[0], "1", 0, "L", true, 0, "")
        
        pdf.SetFont("Arial", "", 8)
        pdf.SetTextColor(0, 0, 0)
        pdf.CellFormat(0, 5, row[1], "1", 1, "L", true, 0, "")
    }
    pdf.Ln(6)
    
    // ==================== CONTENT ====================
    pdf.SetFont("Arial", "", 9.5)
    pdf.SetTextColor(0, 0, 0)
    pdf.Cell(0, 5.5, fmt.Sprintf("Dear Head of %s Department,", memo.Division))
    pdf.Ln(5.5)
    
    pdf.MultiCell(160, 5, memo.Content, "", "", false)
    pdf.Ln(2)
    
    pdf.MultiCell(160, 5, "Your attention to this matter is highly appreciated. Please review and provide your approval.", "", "", false)
    pdf.Ln(6)
    
    // ==================== SIGNATURE ====================
    pdf.SetFont("Arial", "", 9.5)
    pdf.Cell(0, 5.5, "Best regards,")
    pdf.Ln(7)
    
    pdf.SetFont("Arial", "B", 9.5)
    pdf.Cell(0, 5.5, creator.FullName)
    pdf.Ln(3.5)
    pdf.SetFont("Arial", "", 8)
    pdf.SetTextColor(100, 100, 100)
    pdf.Cell(0, 4.5, fmt.Sprintf("%s Department", creator.Division))
    pdf.SetTextColor(0, 0, 0)
    pdf.Ln(8)
    
    // ==================== APPROVAL HISTORY ====================
    if memo.Status == "approved" || memo.Status == "rejected" {
        pdf.SetFont("Arial", "B", 9)
        pdf.SetTextColor(0, 0, 0)
        pdf.Cell(0, 5.5, "APPROVAL HISTORY")
        pdf.Ln(5)
        
        headers := []string{"NO", "APPROVER", "POSITION", "SIGNATURE", "DATE", "STATUS"}
        colWidths := []float64{10, 38, 34, 28, 24, 22}
        
        pdf.SetFillColor(50, 50, 50)
        pdf.SetTextColor(255, 255, 255)
        pdf.SetFont("Arial", "B", 6.5)
        
        for i, header := range headers {
            pdf.CellFormat(colWidths[i], 5.5, header, "1", 0, "C", true, 0, "")
        }
        pdf.Ln(5.5)
        
        pdf.SetFillColor(255, 255, 255)
        pdf.SetTextColor(0, 0, 0)
        pdf.SetFont("Arial", "", 6.5)
        
        statusText := "APPROVED"
        if memo.Status == "rejected" {
            statusText = "REJECTED"
        }
        
        rowData := []string{
            "1",
            approverName,
            fmt.Sprintf("Head of %s", memo.Division),
            "Approved",
            memo.ApprovedAt.Format("02 Jan 06"),
            statusText,
        }
        
        for i, data := range rowData {
            pdf.CellFormat(colWidths[i], 5.5, data, "1", 0, "C", true, 0, "")
        }
        pdf.Ln(6)
    }
    
    // ==================== QR CODE ====================
    if pdf.GetY() < 245 {
        pdf.SetFont("Arial", "B", 8)
        pdf.SetTextColor(0, 0, 0)
        pdf.Cell(0, 4.5, "DOCUMENT VERIFICATION")
        pdf.Ln(3)
        
        pdf.SetFont("Arial", "", 7)
        pdf.SetTextColor(100, 100, 100)
        pdf.Cell(0, 4, "Scan QR Code to verify this document")
        pdf.Ln(4)
        
        // QR Code image
        qrY := pdf.GetY()
        pdf.Image(qrPath, 25, qrY, 35, 35, false, "", 0, "")
        
        pdf.Ln(38)
        pdf.SetFont("Arial", "", 6.5)
        pdf.SetTextColor(0, 0, 150)
        pdf.Cell(0, 3.5, fmt.Sprintf("Verify: localhost:3000/memos/%s", memo.ID[:8]))
        pdf.Ln(3.5)
        
        pdf.SetFont("Arial", "", 6)
        pdf.SetTextColor(120, 120, 120)
        pdf.Cell(0, 3, fmt.Sprintf("ID: DMS-%s", memo.ID[:12]))
    }
    
    filename := fmt.Sprintf("memo_%s.pdf", memo.MemoNumber)
    err = pdf.OutputFileAndClose(filename)
    if err != nil {
        return "", err
    }
    
    return filename, nil
}
