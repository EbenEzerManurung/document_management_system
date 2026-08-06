package models

import (
    "database/sql"
    "time"
)

type User struct {
    ID               string          `json:"id"`
    Username         string          `json:"username"`
    Email            string          `json:"email"`
    PasswordHash     string          `json:"-"`
    FullName         string          `json:"full_name"`
    Division         string          `json:"division"`
    Role             string          `json:"role"` // super_admin, head_manager, staff
    ProfileImage     sql.NullString  `json:"profile_image"`
    DigitalSignature sql.NullString  `json:"digital_signature"`
    IsActive         bool            `json:"is_active"`
    CreatedAt        time.Time       `json:"created_at"`
    UpdatedAt        time.Time       `json:"updated_at"`
}

type Memo struct {
    ID                 string          `json:"id"`
    MemoNumber         string          `json:"memo_number"`
    Title              string          `json:"title"`
    Content            string          `json:"content"`
    Division           string          `json:"division"`
    Status             string          `json:"status"` // draft, pending, approved, rejected, archived
    CreatedBy          string          `json:"created_by"`
    ApprovedBy         sql.NullString  `json:"approved_by"`
    ApprovedAt         *time.Time      `json:"approved_at"`
    QRCode             string          `json:"qr_code"`
    FilePath           sql.NullString  `json:"file_path"`
    CreatedAt          time.Time       `json:"created_at"`
    UpdatedAt          time.Time       `json:"updated_at"`
    Creator            *User           `json:"creator,omitempty"`
    Approver           *User           `json:"approver,omitempty"`
    ApproverSignature  string          `json:"approver_signature,omitempty"`
}

type MemoApproval struct {
    ID             string     `json:"id"`
    MemoID         string     `json:"memo_id"`
    ApproverID     string     `json:"approver_id"`
    Division       string     `json:"division"`
    Status         string     `json:"status"`
    SignatureImage string     `json:"signature_image"`
    SignedAt       *time.Time `json:"signed_at"`
    Comments       string     `json:"comments"`
    CreatedAt      time.Time  `json:"created_at"`
    UpdatedAt      time.Time  `json:"updated_at"`
}

type AuditLog struct {
    ID          string    `json:"id"`
    UserID      string    `json:"user_id"`
    Action      string    `json:"action"`
    Description string    `json:"description"`
    IPAddress   string    `json:"ip_address"`
    UserAgent   string    `json:"user_agent"`
    CreatedAt   time.Time `json:"created_at"`
}

// Request/Response models
type LoginRequest struct {
    Email    string `json:"email" binding:"required"`
    Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
    Username string `json:"username" binding:"required"`
    Email    string `json:"email" binding:"required,email"`
    Password string `json:"password" binding:"required,min=6"`
    FullName string `json:"full_name" binding:"required"`
    Division string `json:"division" binding:"required"`
    Role     string `json:"role" binding:"required"`
}

type CreateMemoRequest struct {
    Title    string `json:"title" binding:"required"`
    Content  string `json:"content" binding:"required"`
    Division string `json:"division" binding:"required"`
}

type UpdateUserRequest struct {
    FullName         string `json:"full_name"`
    ProfileImage     string `json:"profile_image"`
    DigitalSignature string `json:"digital_signature"`
    Password         string `json:"password"`
}

type UpdateProfileImageRequest struct {
    ProfileImage string `json:"profile_image" binding:"required"`
}

type UpdateSignatureRequest struct {
    DigitalSignature string `json:"digital_signature" binding:"required"`
}

type ChangePasswordRequest struct {
    OldPassword string `json:"old_password" binding:"required"`
    NewPassword string `json:"new_password" binding:"required,min=6"`
}
