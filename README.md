# 📄 Document Management System (DMS)

A modern enterprise-grade **Document Management System (DMS)** built with **Next.js 16**, **Go (Gin)**, and **MySQL**.  
Designed to streamline document lifecycle management through secure storage, approval workflows, role-based access control, digital signatures, and audit logging.

---

## Technology Stack

<p align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript)
![Go](https://img.shields.io/badge/Go-1.22-00ADD8?style=for-the-badge&logo=go)
![Gin](https://img.shields.io/badge/Gin-Web_Framework-00ADD8?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38BDF8?style=for-the-badge&logo=tailwind-css)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)

</p>

---

# Overview

This project demonstrates an enterprise document management workflow commonly found in corporate environments.

Core business processes include:

- Secure document submission
- Multi-level approval workflow
- Digital signature
- QR Code verification
- Document versioning
- Role-Based Access Control (RBAC)
- Audit trail
- Document lifecycle management

---

# Key Features

## Document Management

- Upload documents (PDF, DOCX, XLSX, Images)
- Version history
- Category & document classification
- Metadata management
- Advanced search
- Bulk upload & download

---

## Approval Workflow

- Multi-level approval
- Approval / Reject with remarks
- Document status tracking
- Approval history
- Revision workflow

---

## User & Role Management

- JWT Authentication
- Role-Based Access Control (RBAC)
- User profile management
- Activity logs
- Permission management

Supported roles:

- Super Admin
- Head Division
- Staff Division

---

## Dashboard

- Document statistics
- Pending approvals
- Recent activities
- Storage usage
- User statistics

---

## Security

- JWT Authentication
- Password hashing (bcrypt)
- Authorization Middleware
- Audit Trail
- Secure File Upload Validation
- Protected API Routes

---

## Responsive User Interface

- Desktop
- Tablet
- Mobile

Built using

- Next.js App Router
- TailwindCSS
- shadcn/ui
- Radix UI

---

# Technology Stack

| Category | Technology |
|------------|------------|
| Frontend | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS |
| Forms | React Hook Form |
| Validation | Zod |
| Notifications | React Toastify |
| Backend | Go (Gin Framework) |
| ORM | GORM |
| Database | MySQL |
| Authentication | JWT + bcrypt |
| File Upload | Multipart Form Data |
| API | REST API |

---

# User Roles

| Role | Responsibilities |
|------|------------------|
| Super Admin | Full system administration, user management, document oversight |
| Head Division | Review, approve/reject documents within the division |
| Staff Division | Create, edit, and submit documents |

---

# Project Architecture

```
Next.js Frontend
        │
 REST API (JSON)
        │
 Go (Gin Framework)
        │
      GORM
        │
      MySQL
```

---

# Project Structure

```
frontend/
│
├── app/
├── components/
├── hooks/
├── lib/
├── services/
├── types/
└── public/

backend/
│
├── controllers/
├── middleware/
├── models/
├── repositories/
├── routes/
├── services/
└── utils/
```

---

# Screenshots

## Login

*(Insert Screenshot)*

---

## Dashboard

*(Insert Screenshot)*

---

## Document Approval

*(Insert Screenshot)*

---

## Golang REST API

*(Insert Screenshot)*

---

# Future Enhancements

- Email notification
- Document expiration reminder
- OCR support
- Elasticsearch integration
- Two-Factor Authentication (2FA)
- Microsoft Office Preview
- Real-time notifications
- Docker deployment
- CI/CD Pipeline

---

# License

MIT License

---

# Author

**Eben Ezer Manurung**

Backend Developer • Full Stack Developer
