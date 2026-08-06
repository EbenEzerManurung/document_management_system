package services

import (
    "database/sql"
    "errors"
    "crypto/md5"
    "fmt"
    "time"
    "dms-backend/database"
    "dms-backend/models"
    "dms-backend/utils"
    "golang.org/x/crypto/bcrypt"
)

type AuthService struct{}

func NewAuthService() *AuthService {
    return &AuthService{}
}

func (s *AuthService) Login(req models.LoginRequest) (string, *models.User, error) {
    db := database.GetDB()
    
    var user models.User
    query := `SELECT id, username, email, password_hash, full_name, division, role, profile_image, digital_signature, is_active 
              FROM users WHERE email = ? AND is_active = 1`
    
    err := db.QueryRow(query, req.Email).Scan(
        &user.ID, &user.Username, &user.Email, &user.PasswordHash,
        &user.FullName, &user.Division, &user.Role, &user.ProfileImage,
        &user.DigitalSignature, &user.IsActive,
    )
    
    if err != nil {
        if err == sql.ErrNoRows {
            return "", nil, errors.New("invalid email or password")
        }
        return "", nil, err
    }
    
    err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
    if err != nil {
        return "", nil, errors.New("invalid email or password")
    }
    
    token, err := utils.GenerateToken(user.ID, user.Email, user.Division, user.Role)
    if err != nil {
        return "", nil, err
    }
    
    return token, &user, nil
}

func (s *AuthService) GetUserByID(userID string) (*models.User, error) {
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
        if err == sql.ErrNoRows {
            return nil, errors.New("user not found")
        }
        return nil, err
    }
    
    return &user, nil
}

func (s *AuthService) Register(req models.RegisterRequest) (*models.User, error) {
    db := database.GetDB()
    
    var existingEmail string
    err := db.QueryRow("SELECT email FROM users WHERE email = ?", req.Email).Scan(&existingEmail)
    if err == nil {
        return nil, errors.New("email already registered")
    } else if err != sql.ErrNoRows {
        return nil, err
    }
    
    var existingUsername string
    err = db.QueryRow("SELECT username FROM users WHERE username = ?", req.Username).Scan(&existingUsername)
    if err == nil {
        return nil, errors.New("username already taken")
    } else if err != sql.ErrNoRows {
        return nil, err
    }
    
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        return nil, err
    }
    
    userID := generateUserID()
    query := `INSERT INTO users (id, username, email, password_hash, full_name, division, role, is_active) 
              VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
    
    _, err = db.Exec(query, userID, req.Username, req.Email, string(hashedPassword), 
                     req.FullName, req.Division, req.Role)
    if err != nil {
        return nil, err
    }
    
    return s.GetUserByID(userID)
}

func generateUserID() string {
    hash := md5.Sum([]byte(fmt.Sprintf("%d", time.Now().UnixNano())))
    return fmt.Sprintf("user_%x", hash[:8])
}
