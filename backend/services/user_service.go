package services

import (
    "context"
    "database/sql"
    "errors"
    "strings"
    "time"
    "dms-backend/database"
    "dms-backend/models"
    "golang.org/x/crypto/bcrypt"
)

type UserService struct{}

func NewUserService() *UserService {
    return &UserService{}
}

func (s *UserService) GetUserByID(userID string) (*models.User, error) {
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

func (s *UserService) GetAllUsers() ([]*models.User, error) {
    db := database.GetDB()
    
    query := `SELECT id, username, email, full_name, division, role, profile_image, digital_signature, is_active 
              FROM users ORDER BY division, full_name`
    
    rows, err := db.Query(query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var users []*models.User
    for rows.Next() {
        var user models.User
        err := rows.Scan(
            &user.ID, &user.Username, &user.Email, &user.FullName,
            &user.Division, &user.Role, &user.ProfileImage,
            &user.DigitalSignature, &user.IsActive,
        )
        if err != nil {
            return nil, err
        }
        users = append(users, &user)
    }
    
    return users, nil
}

func (s *UserService) UpdateProfile(userID string, req models.UpdateUserRequest) (*models.User, error) {
    db := database.GetDB()
    
    updates := []string{}
    args := []interface{}{}
    
    if req.FullName != "" {
        updates = append(updates, "full_name = ?")
        args = append(args, req.FullName)
    }
    
    if req.ProfileImage != "" {
        updates = append(updates, "profile_image = ?")
        args = append(args, req.ProfileImage)
    }
    
    if req.DigitalSignature != "" {
        updates = append(updates, "digital_signature = ?")
        args = append(args, req.DigitalSignature)
    }
    
    if len(updates) == 0 {
        return s.GetUserByID(userID)
    }
    
    query := "UPDATE users SET "
    for i, update := range updates {
        if i > 0 {
            query += ", "
        }
        query += update
    }
    query += " WHERE id = ?"
    args = append(args, userID)
    
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    _, err := db.ExecContext(ctx, query, args...)
    if err != nil {
        return nil, err
    }
    
    return s.GetUserByID(userID)
}

func (s *UserService) UpdateProfileImage(userID, imagePath string) error {
    db := database.GetDB()
    
    if !strings.HasPrefix(imagePath, "data:image/") && !strings.HasPrefix(imagePath, "http") {
        return errors.New("invalid image format")
    }
    
    ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
    defer cancel()
    
    result, err := db.ExecContext(ctx, `UPDATE users SET profile_image = ? WHERE id = ?`, imagePath, userID)
    if err != nil {
        return err
    }
    
    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        return errors.New("user not found")
    }
    
    return nil
}

func (s *UserService) UpdateSignature(userID, signature string) error {
    db := database.GetDB()
    
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    _, err := db.ExecContext(ctx, `UPDATE users SET digital_signature = ? WHERE id = ?`, signature, userID)
    return err
}

func (s *UserService) ChangePassword(userID, oldPassword, newPassword string) error {
    db := database.GetDB()
    
    var currentHash string
    err := db.QueryRow("SELECT password_hash FROM users WHERE id = ?", userID).Scan(&currentHash)
    if err != nil {
        return err
    }
    
    err = bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(oldPassword))
    if err != nil {
        return errors.New("incorrect old password")
    }
    
    newHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    _, err = db.ExecContext(ctx, "UPDATE users SET password_hash = ? WHERE id = ?", string(newHash), userID)
    return err
}

func (s *UserService) GetUsersByDivision(division string) ([]*models.User, error) {
    db := database.GetDB()
    
    query := `SELECT id, username, email, full_name, division, role, profile_image, digital_signature, is_active 
              FROM users WHERE division = ? ORDER BY full_name`
    
    rows, err := db.Query(query, division)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var users []*models.User
    for rows.Next() {
        var user models.User
        err := rows.Scan(
            &user.ID, &user.Username, &user.Email, &user.FullName,
            &user.Division, &user.Role, &user.ProfileImage,
            &user.DigitalSignature, &user.IsActive,
        )
        if err != nil {
            return nil, err
        }
        users = append(users, &user)
    }
    
    return users, nil
}

func (s *UserService) DeactivateUser(userID string) error {
    db := database.GetDB()
    
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    _, err := db.ExecContext(ctx, "UPDATE users SET is_active = 0 WHERE id = ?", userID)
    return err
}

func (s *UserService) ActivateUser(userID string) error {
    db := database.GetDB()
    
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    
    _, err := db.ExecContext(ctx, "UPDATE users SET is_active = 1 WHERE id = ?", userID)
    return err
}
