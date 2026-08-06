package services

import (
    "database/sql"
    "errors"
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

func (s *UserService) UpdateProfile(userID string, req models.UpdateUserRequest) (*models.User, error) {
    db := database.GetDB()
    
    // Build update query
    query := "UPDATE users SET "
    args := []interface{}{}
    updates := []string{}
    
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
    
    query += join(updates, ", ")
    query += " WHERE id = ?"
    args = append(args, userID)
    
    _, err := db.Exec(query, args...)
    if err != nil {
        return nil, err
    }
    
    return s.GetUserByID(userID)
}

func (s *UserService) UpdateProfileImage(userID, imagePath string) error {
    db := database.GetDB()
    _, err := db.Exec(`UPDATE users SET profile_image = ? WHERE id = ?`, imagePath, userID)
    return err
}

func (s *UserService) UpdateSignature(userID, signature string) error {
    db := database.GetDB()
    _, err := db.Exec(`UPDATE users SET digital_signature = ? WHERE id = ?`, signature, userID)
    return err
}

func (s *UserService) ChangePassword(userID, oldPassword, newPassword string) error {
    db := database.GetDB()
    
    // Get current password hash
    var currentHash string
    err := db.QueryRow("SELECT password_hash FROM users WHERE id = ?", userID).Scan(&currentHash)
    if err != nil {
        return err
    }
    
    // Verify old password
    err = bcrypt.CompareHashAndPassword([]byte(currentHash), []byte(oldPassword))
    if err != nil {
        return errors.New("incorrect old password")
    }
    
    // Hash new password
    newHash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    
    // Update password
    _, err = db.Exec("UPDATE users SET password_hash = ? WHERE id = ?", string(newHash), userID)
    return err
}

func (s *UserService) GetUsersByDivision(division string) ([]*models.User, error) {
    db := database.GetDB()
    
    query := `SELECT id, username, email, full_name, division, role, profile_image, digital_signature, is_active 
              FROM users WHERE division = ? AND is_active = 1`
    
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
    _, err := db.Exec("UPDATE users SET is_active = 0 WHERE id = ?", userID)
    return err
}

func (s *UserService) ActivateUser(userID string) error {
    db := database.GetDB()
    _, err := db.Exec("UPDATE users SET is_active = 1 WHERE id = ?", userID)
    return err
}

func join(updates []string, separator string) string {
    result := ""
    for i, update := range updates {
        if i > 0 {
            result += separator
        }
        result += update
    }
    return result
}