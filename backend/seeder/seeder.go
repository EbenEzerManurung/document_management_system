package main

import (
    "database/sql"
    "fmt"
    "log"
    "os"
    _ "github.com/go-sql-driver/mysql"
    "github.com/joho/godotenv"
)

func main() {
    err := godotenv.Load()
    if err != nil {
        log.Println("Warning: .env file not found")
    }

    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        os.Getenv("DB_USER"),
        os.Getenv("DB_PASSWORD"),
        os.Getenv("DB_HOST"),
        os.Getenv("DB_PORT"),
        os.Getenv("DB_NAME"),
    )

    db, err := sql.Open("mysql", dsn)
    if err != nil {
        log.Fatal("Error connecting to database:", err)
    }
    defer db.Close()

    // Run migrations
    migrations := []string{
        `CREATE DATABASE IF NOT EXISTS dms_db`,
        `USE dms_db`,
        
        // Users table
        `CREATE TABLE IF NOT EXISTS users (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            division ENUM('HR', 'Accounting', 'Finance', 'Marketing', 'IT', 'Purchase', 'Claim') NOT NULL,
            role ENUM('head_manager', 'staff') NOT NULL,
            profile_image VARCHAR(255),
            digital_signature TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Memos table
        `CREATE TABLE IF NOT EXISTS memos (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            memo_number VARCHAR(50) UNIQUE NOT NULL,
            title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            division ENUM('HR', 'Accounting', 'Finance', 'Marketing', 'IT', 'Purchase', 'Claim') NOT NULL,
            status ENUM('draft', 'pending', 'approved', 'rejected', 'archived') DEFAULT 'draft',
            created_by CHAR(36),
            approved_by CHAR(36),
            approved_at TIMESTAMP NULL,
            qr_code TEXT,
            file_path VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Memo approvals table
        `CREATE TABLE IF NOT EXISTS memo_approvals (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            memo_id CHAR(36) NOT NULL,
            approver_id CHAR(36) NOT NULL,
            division ENUM('HR', 'Accounting', 'Finance', 'Marketing', 'IT', 'Purchase', 'Claim') NOT NULL,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            signature_image TEXT,
            signed_at TIMESTAMP NULL,
            comments TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE,
            FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Audit logs table
        `CREATE TABLE IF NOT EXISTS audit_logs (
            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
            user_id CHAR(36),
            action VARCHAR(50),
            description TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
        
        // Indexes
        `CREATE INDEX IF NOT EXISTS idx_memos_division ON memos(division)`,
        `CREATE INDEX IF NOT EXISTS idx_memos_status ON memos(status)`,
        `CREATE INDEX IF NOT EXISTS idx_memos_created_by ON memos(created_by)`,
        `CREATE INDEX IF NOT EXISTS idx_memo_approvals_memo_id ON memo_approvals(memo_id)`,
        `CREATE INDEX IF NOT EXISTS idx_memo_approvals_approver_id ON memo_approvals(approver_id)`,
        `CREATE INDEX IF NOT EXISTS idx_users_division ON users(division)`,
        `CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`,
    }
    
    for _, migration := range migrations {
        _, err = db.Exec(migration)
        if err != nil {
            log.Printf("Error executing migration: %s\nError: %v", migration, err)
        } else {
            log.Printf("Migration executed successfully")
        }
    }
    
    log.Println("All migrations completed!")
}