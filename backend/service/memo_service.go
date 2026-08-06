package services

import (
    "database/sql"
    "errors"
    "fmt"
    "time"
    "crypto/md5"
    "encoding/base64"
    "dms-backend/database"
    "dms-backend/models"
)

type MemoService struct{}

func NewMemoService() *MemoService {
    return &MemoService{}
}

func (s *MemoService) CreateMemo(req models.CreateMemoRequest, createdBy string) (*models.Memo, error) {
    db := database.GetDB()
    
    memoID := generateMemoID()
    memoNumber := fmt.Sprintf("MEMO-%s-%d", req.Division, time.Now().UnixNano()%100000)
    
    // Generate QR Code
    qrCode := s.generateQRCode(memoID, memoNumber, req.Division)
    
    query := `INSERT INTO memos (id, memo_number, title, content, division, status, created_by, qr_code) 
              VALUES (?, ?, ?, ?, ?, 'draft', ?, ?)`
    
    _, err := db.Exec(query, memoID, memoNumber, req.Title, req.Content, 
                      req.Division, createdBy, qrCode)
    if err != nil {
        return nil, err
    }
    
    // Get created memo
    return s.GetMemoByID(memoID)
}

func (s *MemoService) GetMemoByID(memoID string) (*models.Memo, error) {
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
        if err == sql.ErrNoRows {
            return nil, errors.New("memo not found")
        }
        return nil, err
    }
    
    // Load creator
    creator, _ := s.loadUser(memo.CreatedBy)
    memo.Creator = creator
    
    // Load approver if exists
    if memo.ApprovedBy != "" {
        approver, _ := s.loadUser(memo.ApprovedBy)
        memo.Approver = approver
    }
    
    return &memo, nil
}

func (s *MemoService) GetMemosByDivision(division string, limit, offset int) ([]*models.Memo, error) {
    db := database.GetDB()
    
    query := `SELECT id, memo_number, title, content, division, status, created_by, approved_by, approved_at, qr_code, file_path, created_at, updated_at 
              FROM memos WHERE division = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
    
    rows, err := db.Query(query, division, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var memos []*models.Memo
    for rows.Next() {
        var memo models.Memo
        err := rows.Scan(
            &memo.ID, &memo.MemoNumber, &memo.Title, &memo.Content,
            &memo.Division, &memo.Status, &memo.CreatedBy, &memo.ApprovedBy,
            &memo.ApprovedAt, &memo.QRCode, &memo.FilePath,
            &memo.CreatedAt, &memo.UpdatedAt,
        )
        if err != nil {
            return nil, err
        }
        memos = append(memos, &memo)
    }
    
    return memos, nil
}

func (s *MemoService) UpdateMemoStatus(memoID, status, approverID string) error {
    db := database.GetDB()
    
    approvedAt := time.Now()
    query := `UPDATE memos SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?`
    
    _, err := db.Exec(query, status, approverID, approvedAt, memoID)
    return err
}

func (s *MemoService) ApproveMemo(memoID, approverID, signature, comments string) error {
    db := database.GetDB()
    
    // Start transaction
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    // Update memo status
    _, err = tx.Exec(`UPDATE memos SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?`,
                      approverID, time.Now(), memoID)
    if err != nil {
        return err
    }
    
    // Create approval record
    _, err = tx.Exec(`INSERT INTO memo_approvals (id, memo_id, approver_id, division, status, signature_image, comments, signed_at) 
                      VALUES (?, ?, ?, (SELECT division FROM memos WHERE id = ?), 'approved', ?, ?, ?)`,
                      generateMemoID(), memoID, approverID, memoID, signature, comments, time.Now())
    if err != nil {
        return err
    }
    
    return tx.Commit()
}

func (s *MemoService) RejectMemo(memoID, approverID, comments string) error {
    db := database.GetDB()
    
    // Start transaction
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    // Update memo status
    _, err = tx.Exec(`UPDATE memos SET status = 'rejected' WHERE id = ?`, memoID)
    if err != nil {
        return err
    }
    
    // Create rejection record
    _, err = tx.Exec(`INSERT INTO memo_approvals (id, memo_id, approver_id, division, status, comments, signed_at) 
                      VALUES (?, ?, ?, (SELECT division FROM memos WHERE id = ?), 'rejected', ?, ?)`,
                      generateMemoID(), memoID, approverID, memoID, comments, time.Now())
    if err != nil {
        return err
    }
    
    return tx.Commit()
}

func (s *MemoService) DeleteMemo(memoID string) error {
    db := database.GetDB()
    _, err := db.Exec(`DELETE FROM memos WHERE id = ?`, memoID)
    return err
}

func (s *MemoService) GetMemosByStatus(status, division string) ([]*models.Memo, error) {
    db := database.GetDB()
    
    query := `SELECT id, memo_number, title, content, division, status, created_by, approved_by, approved_at, qr_code, file_path, created_at, updated_at 
              FROM memos WHERE status = ? AND division = ? ORDER BY created_at DESC`
    
    rows, err := db.Query(query, status, division)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var memos []*models.Memo
    for rows.Next() {
        var memo models.Memo
        err := rows.Scan(
            &memo.ID, &memo.MemoNumber, &memo.Title, &memo.Content,
            &memo.Division, &memo.Status, &memo.CreatedBy, &memo.ApprovedBy,
            &memo.ApprovedAt, &memo.QRCode, &memo.FilePath,
            &memo.CreatedAt, &memo.UpdatedAt,
        )
        if err != nil {
            return nil, err
        }
        memos = append(memos, &memo)
    }
    
    return memos, nil
}

func (s *MemoService) GetMemoByQRCode(qrData string) (*models.Memo, error) {
    // Decode QR data and find memo
    // This is simplified - in production, you'd decode properly
    db := database.GetDB()
    
    var memo models.Memo
    query := `SELECT id, memo_number, title, content, division, status, created_by, approved_by, approved_at, qr_code, file_path, created_at, updated_at 
              FROM memos WHERE qr_code = ?`
    
    err := db.QueryRow(query, qrData).Scan(
        &memo.ID, &memo.MemoNumber, &memo.Title, &memo.Content,
        &memo.Division, &memo.Status, &memo.CreatedBy, &memo.ApprovedBy,
        &memo.ApprovedAt, &memo.QRCode, &memo.FilePath,
        &memo.CreatedAt, &memo.UpdatedAt,
    )
    
    if err != nil {
        return nil, err
    }
    
    return &memo, nil
}

// Helper functions
func (s *MemoService) generateQRCode(memoID, memoNumber, division string) string {
    data := fmt.Sprintf(`{"id":"%s","no":"%s","div":"%s"}`, memoID[:8], memoNumber, division[:2])
    return base64.StdEncoding.EncodeToString([]byte(data))
}

func (s *MemoService) loadUser(userID string) (*models.User, error) {
    db := database.GetDB()
    
    var user models.User
    query := `SELECT id, username, email, full_name, division, role, profile_image, digital_signature, is_active 
              FROM users WHERE id = ?`
    
    err := db.QueryRow(query, userID).Scan(
        &user.ID, &user.Username, &user.Email, &user.FullName,
        &user.Division, &user.Role, &user.ProfileImage,
        &user.DigitalSignature, &user.IsActive,
    )
    
    if err != nil {
        return nil, err
    }
    
    return &user, nil
}

func generateMemoID() string {
    hash := md5.Sum([]byte(time.Now().String()))
    return fmt.Sprintf("memo_%x", hash[:8])
}