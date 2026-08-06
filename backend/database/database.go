package database

import (
    "database/sql"
    "fmt"
    "log"
    "time"
    "dms-backend/config"
    _ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func Connect() error {
    cfg := config.LoadConfig()
    
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&timeout=30s&readTimeout=30s&writeTimeout=30s",
        cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
    
    var err error
    DB, err = sql.Open("mysql", dsn)
    if err != nil {
        return fmt.Errorf("failed to connect to database: %v", err)
    }
    
    // Configure connection pool
    DB.SetMaxOpenConns(25)
    DB.SetMaxIdleConns(10)
    DB.SetConnMaxLifetime(5 * time.Minute)
    DB.SetConnMaxIdleTime(1 * time.Minute)
    
    // Test connection with retry
    maxRetries := 5
    for i := 0; i < maxRetries; i++ {
        err = DB.Ping()
        if err == nil {
            break
        }
        log.Printf("Database ping attempt %d failed: %v, retrying...", i+1, err)
        time.Sleep(2 * time.Second)
    }
    if err != nil {
        return fmt.Errorf("failed to ping database after %d retries: %v", maxRetries, err)
    }
    
    log.Println("Database connected successfully")
    return nil
}

func GetDB() *sql.DB {
    return DB
}

func Close() error {
    if DB != nil {
        return DB.Close()
    }
    return nil
}
