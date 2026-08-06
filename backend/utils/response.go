package utils

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "github.com/gin-gonic/gin"
)

type Response struct {
    Status  int         `json:"status"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
}

func SuccessResponse(c *gin.Context, message string, data interface{}) {
    c.JSON(http.StatusOK, Response{
        Status:  http.StatusOK,
        Message: message,
        Data:    data,
    })
}

func CreatedResponse(c *gin.Context, message string, data interface{}) {
    c.JSON(http.StatusCreated, Response{
        Status:  http.StatusCreated,
        Message: message,
        Data:    data,
    })
}

func ErrorResponse(c *gin.Context, status int, message string, err error) {
    response := Response{
        Status:  status,
        Message: message,
    }
    if err != nil {
        response.Error = err.Error()
    }
    c.JSON(status, response)
}

func BadRequestResponse(c *gin.Context, message string) {
    ErrorResponse(c, http.StatusBadRequest, message, nil)
}

func UnauthorizedResponse(c *gin.Context, message string) {
    ErrorResponse(c, http.StatusUnauthorized, message, nil)
}

func NotFoundResponse(c *gin.Context, message string) {
    ErrorResponse(c, http.StatusNotFound, message, nil)
}

func InternalServerErrorResponse(c *gin.Context, err error) {
    ErrorResponse(c, http.StatusInternalServerError, "Internal server error", err)
}

// Helper untuk marshal NullString ke JSON
type NullString sql.NullString

func (ns NullString) MarshalJSON() ([]byte, error) {
    if !ns.Valid {
        return []byte("null"), nil
    }
    return json.Marshal(ns.String)
}
