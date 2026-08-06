package utils

import (
    "errors"
    "time"
    "dms-backend/config"
    "github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
    UserID   string `json:"user_id"`
    Email    string `json:"email"`
    Division string `json:"division"`
    Role     string `json:"role"`
    jwt.RegisteredClaims
}

func GenerateToken(userID, email, division, role string) (string, error) {
    cfg := config.LoadConfig()
    
    claims := JWTClaims{
        UserID:   userID,
        Email:    email,
        Division: division,
        Role:     role,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            NotBefore: jwt.NewNumericDate(time.Now()),
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    return token.SignedString([]byte(cfg.JWTSecret))
}

func ValidateToken(tokenString string) (*JWTClaims, error) {
    cfg := config.LoadConfig()
    
    token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
        return []byte(cfg.JWTSecret), nil
    })
    
    if err != nil {
        return nil, err
    }
    
    if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
        return claims, nil
    }
    
    return nil, errors.New("invalid token")
}
