package services

import (
    "database/sql"
    "errors"
    "fmt"
    "time"
    "crypto/md5"
    "encoding/base64"
    "log"
    "regexp"
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
    memoNumber, err := s.generateMemoNumber(req.Division)
    if err != nil {
        return nil, err
    }
    
    qrData := fmt.Sprintf("http://localhost:3000/memos/%s", memoID)
    qrCode := base64.StdEncoding.EncodeToString([]byte(qrData))
    
    query := `INSERT INTO memos (id, memo_number, title, content, division, status, created_by, qr_code) 
              VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
    
    _, err = db.Exec(query, memoID, memoNumber, req.Title, req.Content, 
                      req.Division, createdBy, qrCode)
    if err != nil {
        return nil, err
    }
    
    return s.GetMemoByID(memoID)
}

func (s *MemoService) generateMemoNumber(division string) (string, error) {
    db := database.GetDB()
    
    var lastNumber string
    query := `SELECT memo_number FROM memos WHERE division = ? AND memo_number LIKE ? ORDER BY created_at DESC LIMIT 1`
    
    pattern := fmt.Sprintf("MEMO-%s-%%", division)
    err := db.QueryRow(query, division, pattern).Scan(&lastNumber)
    
    var nextNum int = 1
    if err == nil && lastNumber != "" {
        var num int
        fmt.Sscanf(lastNumber, "MEMO-%s-%d", &division, &num)
        nextNum = num + 1
    } else if err != nil && err != sql.ErrNoRows {
        return "", err
    }
    
    return fmt.Sprintf("MEMO-%s-%04d", division, nextNum), nil
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
    
    if memo.CreatedBy != "" {
        creator, _ := s.loadUser(memo.CreatedBy)
        memo.Creator = creator
    }
    
    if memo.ApprovedBy.Valid && memo.ApprovedBy.String != "" {
        approver, _ := s.loadUser(memo.ApprovedBy.String)
        memo.Approver = approver
        
        if memo.Status == "approved" {
            var signature sql.NullString
            err := db.QueryRow(`SELECT signature_image FROM memo_approvals WHERE memo_id = ? AND status = 'approved' ORDER BY signed_at DESC LIMIT 1`, 
                memoID).Scan(&signature)
            if err == nil && signature.Valid && signature.String != "" {
                memo.ApproverSignature = signature.String
            }
        }
    }
    
    return &memo, nil
}

func (s *MemoService) GetMemosByDivision(division string, limit, offset int) ([]*models.Memo, error) {
    db := database.GetDB()
    
    log.Printf("GetMemosByDivision: division=%s, limit=%d, offset=%d", division, limit, offset)
    
    query := `SELECT id, memo_number, title, content, division, status, created_by, approved_by, approved_at, qr_code, file_path, created_at, updated_at 
              FROM memos WHERE division = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
    
    rows, err := db.Query(query, division, limit, offset)
    if err != nil {
        log.Printf("Query error: %v", err)
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
            log.Printf("Scan error: %v", err)
            return nil, err
        }
        
        if memo.CreatedBy != "" {
            creator, _ := s.loadUser(memo.CreatedBy)
            memo.Creator = creator
        }
        
        if memo.ApprovedBy.Valid && memo.ApprovedBy.String != "" {
            approver, _ := s.loadUser(memo.ApprovedBy.String)
            memo.Approver = approver
            
            if memo.Status == "approved" {
                var signature sql.NullString
                err := db.QueryRow(`SELECT signature_image FROM memo_approvals WHERE memo_id = ? AND status = 'approved' ORDER BY signed_at DESC LIMIT 1`, 
                    memo.ID).Scan(&signature)
                if err == nil && signature.Valid && signature.String != "" {
                    memo.ApproverSignature = signature.String
                }
            }
        }
        
        memos = append(memos, &memo)
    }
    
    log.Printf("Found %d memos for division %s", len(memos), division)
    return memos, nil
}

func (s *MemoService) GetMemosByCreator(creatorID string, limit, offset int) ([]*models.Memo, error) {
    db := database.GetDB()
    
    log.Printf("GetMemosByCreator: creatorID=%s, limit=%d, offset=%d", creatorID, limit, offset)
    
    query := `SELECT id, memo_number, title, content, division, status, created_by, approved_by, approved_at, qr_code, file_path, created_at, updated_at 
              FROM memos WHERE created_by = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
    
    rows, err := db.Query(query, creatorID, limit, offset)
    if err != nil {
        log.Printf("Query error: %v", err)
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
            log.Printf("Scan error: %v", err)
            return nil, err
        }
        
        if memo.CreatedBy != "" {
            creator, _ := s.loadUser(memo.CreatedBy)
            memo.Creator = creator
        }
        
        if memo.ApprovedBy.Valid && memo.ApprovedBy.String != "" {
            approver, _ := s.loadUser(memo.ApprovedBy.String)
            memo.Approver = approver
            
            if memo.Status == "approved" {
                var signature sql.NullString
                err := db.QueryRow(`SELECT signature_image FROM memo_approvals WHERE memo_id = ? AND status = 'approved' ORDER BY signed_at DESC LIMIT 1`, 
                    memo.ID).Scan(&signature)
                if err == nil && signature.Valid && signature.String != "" {
                    memo.ApproverSignature = signature.String
                }
            }
        }
        
        memos = append(memos, &memo)
    }
    
    log.Printf("Found %d memos for creator %s", len(memos), creatorID)
    return memos, nil
}

func (s *MemoService) GetAllMemos(limit, offset int) ([]*models.Memo, error) {
    db := database.GetDB()
    
    log.Printf("GetAllMemos: limit=%d, offset=%d", limit, offset)
    
    query := `SELECT id, memo_number, title, content, division, status, created_by, approved_by, approved_at, qr_code, file_path, created_at, updated_at 
              FROM memos ORDER BY created_at DESC LIMIT ? OFFSET ?`
    
    rows, err := db.Query(query, limit, offset)
    if err != nil {
        log.Printf("Query error: %v", err)
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
            log.Printf("Scan error: %v", err)
            return nil, err
        }
        
        if memo.CreatedBy != "" {
            creator, _ := s.loadUser(memo.CreatedBy)
            memo.Creator = creator
        }
        
        if memo.ApprovedBy.Valid && memo.ApprovedBy.String != "" {
            approver, _ := s.loadUser(memo.ApprovedBy.String)
            memo.Approver = approver
            
            if memo.Status == "approved" {
                var signature sql.NullString
                err := db.QueryRow(`SELECT signature_image FROM memo_approvals WHERE memo_id = ? AND status = 'approved' ORDER BY signed_at DESC LIMIT 1`, 
                    memo.ID).Scan(&signature)
                if err == nil && signature.Valid && signature.String != "" {
                    memo.ApproverSignature = signature.String
                }
            }
        }
        
        memos = append(memos, &memo)
    }
    
    log.Printf("Found %d memos total", len(memos))
    return memos, nil
}

func (s *MemoService) GetAllPendingMemos() ([]*models.Memo, error) {
    db := database.GetDB()
    
    query := `SELECT id, memo_number, title, content, division, status, created_by, approved_by, approved_at, qr_code, file_path, created_at, updated_at 
              FROM memos WHERE status = 'pending' ORDER BY created_at DESC`
    
    rows, err := db.Query(query)
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
    var memoID string
    
    decoded, err := base64.StdEncoding.DecodeString(qrData)
    if err == nil {
        decodedStr := string(decoded)
        uuidMatch := regexp.MustCompile(`[a-f0-9-]{36}`).FindString(decodedStr)
        if uuidMatch != "" {
            memoID = uuidMatch
        } else {
            memoMatch := regexp.MustCompile(`memo_[a-f0-9]+`).FindString(decodedStr)
            if memoMatch != "" {
                memoID = memoMatch
            }
        }
    }
    
    if memoID == "" {
        uuidMatch := regexp.MustCompile(`[a-f0-9-]{36}`).FindString(qrData)
        if uuidMatch != "" {
            memoID = uuidMatch
        } else {
            memoMatch := regexp.MustCompile(`memo_[a-f0-9]+`).FindString(qrData)
            if memoMatch != "" {
                memoID = memoMatch
            }
        }
    }
    
    if memoID == "" {
        return nil, errors.New("invalid QR code data")
    }
    
    return s.GetMemoByID(memoID)
}

func (s *MemoService) ApproveMemo(memoID, approverID, signature, comments string) error {
    db := database.GetDB()
    
    log.Printf("=== ApproveMemo called ===")
    log.Printf("memoID: %s", memoID)
    log.Printf("approverID: %s", approverID)
    
    var currentStatus string
    err := db.QueryRow("SELECT status FROM memos WHERE id = ?", memoID).Scan(&currentStatus)
    if err != nil {
        if err == sql.ErrNoRows {
            return errors.New("memo not found")
        }
        return err
    }
    
    if currentStatus != "pending" {
        return fmt.Errorf("memo is not pending, current status: %s", currentStatus)
    }
    
    var userExists bool
    err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE id = ? AND is_active = 1)", approverID).Scan(&userExists)
    if err != nil {
        return err
    }
    if !userExists {
        return errors.New("approver not found or inactive")
    }
    
    var division string
    err = db.QueryRow("SELECT division FROM memos WHERE id = ?", memoID).Scan(&division)
    if err != nil {
        return err
    }
    
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    _, err = tx.Exec(`UPDATE memos SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?`,
        approverID, time.Now(), memoID)
    if err != nil {
        return err
    }
    
    approvalID := generateMemoID()
    _, err = tx.Exec(`INSERT INTO memo_approvals (id, memo_id, approver_id, division, status, signature_image, comments, signed_at) 
        VALUES (?, ?, ?, ?, 'approved', ?, ?, ?)`,
        approvalID, memoID, approverID, division, signature, comments, time.Now())
    if err != nil {
        return err
    }
    
    return tx.Commit()
}

func (s *MemoService) RejectMemo(memoID, approverID, comments string) error {
    db := database.GetDB()
    
    var currentStatus string
    err := db.QueryRow("SELECT status FROM memos WHERE id = ?", memoID).Scan(&currentStatus)
    if err != nil {
        if err == sql.ErrNoRows {
            return errors.New("memo not found")
        }
        return err
    }
    
    if currentStatus != "pending" {
        return fmt.Errorf("memo is not pending, current status: %s", currentStatus)
    }
    
    var division string
    err = db.QueryRow("SELECT division FROM memos WHERE id = ?", memoID).Scan(&division)
    if err != nil {
        return err
    }
    
    tx, err := db.Begin()
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    _, err = tx.Exec(`UPDATE memos SET status = 'rejected' WHERE id = ?`, memoID)
    if err != nil {
        return err
    }
    
    approvalID := generateMemoID()
    _, err = tx.Exec(`INSERT INTO memo_approvals (id, memo_id, approver_id, division, status, comments, signed_at) 
        VALUES (?, ?, ?, ?, 'rejected', ?, ?)`,
        approvalID, memoID, approverID, division, comments, time.Now())
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
    hash := md5.Sum([]byte(fmt.Sprintf("%d", time.Now().UnixNano())))
    return fmt.Sprintf("memo_%x", hash[:8])
}
