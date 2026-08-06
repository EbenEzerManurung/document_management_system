package main

import (
	"database/sql"
	"encoding/base64"
	"fmt"
	"log"
	"math/rand"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbPort := os.Getenv("DB_PORT")
	if dbPort == "" {
		dbPort = "3306"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "root"
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = ""
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "dms_db"
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPassword, dbHost, dbPort, dbName)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatal("Error pinging database:", err)
	}

	log.Println("✅ Connected to database successfully")

	// Disable foreign key checks
	_, err = db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	if err != nil {
		log.Println("Warning: Could not disable foreign key checks")
	}

	// Clear existing data
	db.Exec("DELETE FROM memo_approvals")
	db.Exec("DELETE FROM audit_logs")
	db.Exec("DELETE FROM memos")
	db.Exec("DELETE FROM users")

	// ===== SEED USERS =====
	log.Println("📝 Seeding users...")

	divisions := []string{"HR", "Accounting", "Finance", "Marketing", "IT", "Purchase", "Claim"}

	// ===== 1. SUPER ADMIN =====
	superAdminID := uuid.New().String()
	_, err = db.Exec(
		`INSERT INTO users (id, username, email, password_hash, full_name, division, role, profile_image, digital_signature, is_active)
		VALUES (?, ?, ?, ?, ?, 'All', 'super_admin', '/images/profiles/super_admin.jpg', 'U1VQRVJfU0lH', 1)`,
		superAdminID,
		"super_admin",
		"superadmin@company.com",
		hashPassword("admin123"),
		"Super Admin",
	)
	if err != nil {
		log.Printf("❌ Error inserting super admin: %v", err)
	} else {
		log.Printf("✅ SUPER ADMIN created: superadmin@company.com / admin123 (role=super_admin, division=All)")
	}

	// ===== 2. HEAD MANAGERS =====
	for _, division := range divisions {
		userID := uuid.New().String()
		_, err = db.Exec(
			`INSERT INTO users (id, username, email, password_hash, full_name, division, role, profile_image, digital_signature, is_active)
			VALUES (?, ?, ?, ?, ?, ?, 'head_manager', ?, ?, 1)`,
			userID,
			fmt.Sprintf("head_%s", division),
			fmt.Sprintf("%s_head@company.com", division),
			hashPassword("password123"),
			fmt.Sprintf("Head of %s", division),
			division,
			fmt.Sprintf("/images/profiles/head_%s.jpg", division),
			generateDummySignature(division, "Head"),
		)
		if err != nil {
			log.Printf("❌ Error inserting head %s: %v", division, err)
		} else {
			log.Printf("✅ Head %s: %s_head@company.com / password123", division, division)
		}
	}

	// ===== 3. STAFF (3 per division) =====
	for _, division := range divisions {
		for i := 1; i <= 3; i++ {
			userID := uuid.New().String()
			_, err = db.Exec(
				`INSERT INTO users (id, username, email, password_hash, full_name, division, role, profile_image, digital_signature, is_active)
				VALUES (?, ?, ?, ?, ?, ?, 'staff', ?, ?, 1)`,
				userID,
				fmt.Sprintf("%s_staff_%d", division, i),
				fmt.Sprintf("%s_staff_%d@company.com", division, i),
				hashPassword("password123"),
				fmt.Sprintf("%s Staff %d", division, i),
				division,
				fmt.Sprintf("/images/profiles/%s_staff_%d.jpg", division, i),
				generateDummySignature(division, fmt.Sprintf("Staff %d", i)),
			)
			if err != nil {
				log.Printf("❌ Error inserting staff %s_%d: %v", division, i, err)
			} else {
				log.Printf("✅ Staff %s_%d: %s_staff_%d@company.com / password123", division, i, division, i)
			}
		}
	}

	// ===== SEED MEMOS =====
	log.Println("📝 Seeding memos...")

	rows, err := db.Query("SELECT id, division FROM users WHERE role = 'staff'")
	if err != nil {
		log.Fatal("Error fetching staff users:", err)
	}
	defer rows.Close()

	var staffUsers []struct {
		ID       string
		Division string
	}

	for rows.Next() {
		var user struct {
			ID       string
			Division string
		}
		err = rows.Scan(&user.ID, &user.Division)
		if err != nil {
			log.Fatal("Error scanning staff user:", err)
		}
		staffUsers = append(staffUsers, user)
	}

	if len(staffUsers) > 0 {
		headRows, err := db.Query("SELECT id, division FROM users WHERE role = 'head_manager'")
		if err != nil {
			log.Fatal("Error fetching head managers:", err)
		}
		defer headRows.Close()

		headManagers := make(map[string]string)
		for headRows.Next() {
			var id, division string
			err = headRows.Scan(&id, &division)
			if err != nil {
				log.Fatal("Error scanning head manager:", err)
			}
			headManagers[division] = id
		}

		memoTemplates := []struct {
			Title   string
			Content string
		}{
			{"Request for Additional Budget", "We are requesting additional budget for the upcoming project. Total estimated cost is Rp 500,000,000."},
			{"Hiring New Team Member", "We need to hire a new team member for the department. Position is for a Senior Developer with 5+ years experience."},
			{"Monthly Report Submission", "Please find attached the monthly report for the department. Includes all activities and achievements."},
			{"Training Program Approval", "Requesting approval for a training program for the team. Will be conducted online for 3 days."},
			{"Policy Update Request", "We need to update the department policy regarding work from home arrangements."},
			{"Purchase Request for New Equipment", "Need to purchase new equipment: 10 laptops, 5 monitors, and 3 printers."},
			{"Leave Request", "Requesting annual leave for 5 days starting next Monday."},
			{"Office Renovation Request", "Requesting office renovation including new furniture, painting, and lighting."},
			{"Software License Renewal", "Need to renew software licenses for the department."},
			{"New Project Proposal", "Proposing a new project to improve efficiency and productivity."},
		}

		statuses := []string{"pending", "approved", "rejected"}

		memoCount := 0
		for i := 0; i < 20; i++ {
			if len(staffUsers) == 0 {
				break
			}
			staffUser := staffUsers[rand.Intn(len(staffUsers))]
			status := statuses[rand.Intn(len(statuses))]
			template := memoTemplates[rand.Intn(len(memoTemplates))]

			memoID := uuid.New().String()
			memoNumber := fmt.Sprintf("MEMO-%s-%04d", staffUser.Division, i+1)

			var approvedBy sql.NullString
			var approvedAt *time.Time

			if status == "approved" {
				if headID, ok := headManagers[staffUser.Division]; ok && headID != "" {
					approvedBy = sql.NullString{String: headID, Valid: true}
					t := time.Now().Add(-time.Duration(rand.Intn(7)) * 24 * time.Hour)
					approvedAt = &t
				} else {
					status = "pending"
				}
			}

			qrCode := generateQRCodeSimple(memoID, memoNumber, staffUser.Division)

			if approvedBy.Valid {
				_, err = db.Exec(
					`INSERT INTO memos (id, memo_number, title, content, division, status, created_by, approved_by, approved_at, qr_code)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					memoID, memoNumber, template.Title, template.Content, staffUser.Division,
					status, staffUser.ID, approvedBy, approvedAt, qrCode,
				)
			} else {
				_, err = db.Exec(
					`INSERT INTO memos (id, memo_number, title, content, division, status, created_by, qr_code)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
					memoID, memoNumber, template.Title, template.Content, staffUser.Division,
					status, staffUser.ID, qrCode,
				)
			}

			if err != nil {
				log.Printf("❌ Error inserting memo %s: %v", memoNumber, err)
			} else {
				memoCount++
			}
		}
		log.Printf("✅ Memos seeded successfully! Created %d memos", memoCount)
	} else {
		log.Println("⚠️ No staff users found, skipping memos")
	}

	// Enable foreign key checks
	_, err = db.Exec("SET FOREIGN_KEY_CHECKS = 1")
	if err != nil {
		log.Println("Warning: Could not enable foreign key checks")
	}

	log.Println("✅ All seed data inserted successfully!")
}

func hashPassword(password string) string {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Error hashing password:", err)
	}
	return string(hashedPassword)
}

func generateQRCodeSimple(memoID, memoNumber, division string) string {
	data := fmt.Sprintf(`{"id":"%s","no":"%s","div":"%s"}`, memoID[:8], memoNumber, division[:2])
	return base64.StdEncoding.EncodeToString([]byte(data))
}

func generateDummySignature(division, role string) string {
	signature := fmt.Sprintf("SIG:%s:%s:%d", division, role, time.Now().UnixNano()%10000)
	return base64.StdEncoding.EncodeToString([]byte(signature))
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
