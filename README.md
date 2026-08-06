 Document Management System (DMS)
A comprehensive Document Management System built with Next.js 16, Go (Gin), and MySQL — designed for secure document storage, version control, and seamless team collaboration.

<div align="center">
https://img.shields.io/badge/Next.js-16.3.0-000000?style=for-the-badge&logo=next.js&logoColor=white
https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=white
https://img.shields.io/badge/Go-1.22-00ADD8?style=for-the-badge&logo=go&logoColor=white
https://img.shields.io/badge/TailwindCSS-3.4.17-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white
https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white
https://img.shields.io/badge/TypeScript-5.7.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white

</div>
📑 Table of Contents
✨ Key Features

🚀 Tech Stack

📊 Database Schema

🏗️ Project Structure

🛠️ Installation

👥 User Roles

🔐 Security Features

📸 Screenshots

🤝 Contributing

📝 License

✨ Key Features
📄 Document Management
Upload & Storage – Upload documents in multiple formats (PDF, DOCX, XLSX, images)

Version Control – Track document versions with complete history

Category Management – Organize documents by categories and tags

Advanced Search – Full-text search with filters by date, category, status

Bulk Operations – Batch upload, download, and delete documents

📊 Dashboard & Analytics
Real-time dashboard with key metrics (Total Documents, Users, Storage Usage)

Document activity charts and trends

Recent uploads and pending approvals

Storage utilization visualization

👥 User Management
Role-based access control (Super Admin, Admin, User, Guest)

User profiles with avatar upload

Activity logs and audit trails

Password reset and account management

🔄 Approval Workflow
Document submission and approval process

Role-based approval routing

Rejection with comments

Status tracking (Draft, Pending, Approved, Rejected, Archived)

🔒 Security Features
JWT Authentication with secure token storage

Role-Based Access Control (RBAC)

Document Encryption for sensitive files

Audit Trail – Complete activity logging

Rate Limiting – Protect against brute force attacks

Secure File Upload – MIME type validation and virus scanning

📱 Responsive Design
Fully responsive UI with TailwindCSS

Mobile-first approach

Touch-optimized for tablets and mobile devices

Progressive Web App (PWA) ready

🔍 Document Viewer
Built-in PDF viewer

Image preview gallery

Document metadata display

Full-screen viewing mode

🎨 Modern UI/UX
Clean, professional interface with shadcn/ui components

Dark/Light mode support

Loading skeletons for better UX

Toast notifications for real-time feedback

Export data to Excel and PDF formats

🚀 Tech Stack
Category	Technology	Version
Frontend	Next.js (App Router)	16.3.0
Frontend UI	React	19.0.0
Styling	TailwindCSS	3.4.17
Components	shadcn/ui (Radix UI)	Latest
Forms	React Hook Form	7.54.0
Validation	Zod	3.24.0
State Management	Context API + React Query	-
Notifications	React Toastify	11.0.0
Backend	Go (Gin Framework)	1.22
Database	MySQL	8.0
ORM	GORM	1.25
Authentication	JWT + bcrypt	v5.x
PDF Generation	Go PDF Libraries 1.22

👥 User Roles
Role	Permissions
Super Admin	Full system access, user management, system configuration
Head Division	Document management, user management (in Division), approval authority
Staff Division	Create documents, edit own documents, view documents.

# \# screenshots:
## API Golang
<img width="1918" height="997" alt="image" src="https://github.com/user-attachments/assets/7dd36764-f471-44dd-a5ca-a28aac8ebfd3" />

## Frontend:NEXTJS
<img width="681" height="181" alt="image" src="https://github.com/user-attachments/assets/42a0e187-f26f-4bd5-8da3-dda7d526d2b0" />
