# 📄 Document Management System (DMS)

A modern **Enterprise Document Management System (DMS)** built with **Next.js 16.3.0**, **Go (Gin Framework)**, and **MySQL**.

Designed to streamline the entire document lifecycle—from creation and approval to digital signature, QR code verification, version control, and secure archival—through a scalable RESTful architecture and a Progressive Web App (PWA) experience.

---

## 🚀 Technology Stack

<p align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?style=for-the-badge\&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge\&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge\&logo=typescript)
![Go](https://img.shields.io/badge/Go-1.22-00ADD8?style=for-the-badge\&logo=go)
![Gin](https://img.shields.io/badge/Gin-Web_Framework-00ADD8?style=for-the-badge)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38BDF8?style=for-the-badge\&logo=tailwind-css)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge\&logo=mysql)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=for-the-badge\&logo=pwa)

</p>

---

# 📖 Overview

This project demonstrates an enterprise-grade document management workflow commonly implemented within corporate organizations.

The system enables secure document management through:

* Secure document submission
* Multi-level approval workflow
* Digital signature
* QR Code verification
* Document version control
* Role-Based Access Control (RBAC)
* Audit trail
* Progressive Web App (PWA)
* Complete document lifecycle management

---

# ✨ Key Features

## 📄 Document Management

* Document version control
* Category & classification management
* Metadata management
* Advanced search & filtering
* Bulk upload & download
* Secure document storage

---

## 🔄 Approval Workflow

* Multi-level approval process
* Approve / Reject with comments
* Revision workflow
* Approval history
* Document status tracking
* Approval timeline

---

## 👥 User & Role Management

* JWT Authentication
* Role-Based Access Control (RBAC)
* User profile management
* Permission management
* Activity logging
* Audit trail

Supported roles:

* Super Admin
* Head Division
* Staff Division

---

## 📊 Dashboard & Analytics

* Document statistics
* Pending approvals
* User statistics
* Recent activities
* Storage utilization
* Approval overview

---

## 🔒 Security

* JWT Authentication
* Password Hashing (bcrypt)
* Authorization Middleware
* Protected REST API
* Audit Trail
* Secure File Upload Validation
* Role-Based Authorization

---

## 📱 Progressive Web App (PWA)

Designed to provide a native application experience across desktop and mobile devices.

### Features

* Installable on Desktop & Mobile
* Web App Manifest
* Service Worker Support
* Responsive User Interface
* Fast Asset Loading
* Offline-ready Support *(where applicable)*
* Native App-like Experience
* Home Screen Installation

---

## 🎨 Responsive User Interface

Built using modern frontend technologies:

* Next.js App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Radix UI
* React Hook Form
* Zod Validation

Responsive for:

* Desktop
* Tablet
* Mobile

---

# 🛠 Technology Stack

| Category            | Technology                        |
| ------------------- | --------------------------------- |
| Frontend            | Next.js 16 (App Router)           |
| Language            | TypeScript                        |
| UI Components       | shadcn/ui + Radix UI              |
| Styling             | Tailwind CSS                      |
| Progressive Web App | Web App Manifest + Service Worker |
| Forms               | React Hook Form                   |
| Validation          | Zod                               |
| Notifications       | React Toastify                    |
| Backend             | Go (Gin Framework)                |
| ORM                 | GORM                              |
| Database            | MySQL                             |
| Authentication      | JWT + bcrypt                      |
| File Upload         | Multipart Form Data               |
| API                 | RESTful API                       |

---

# 👥 User Roles

| Role               | Responsibilities                                                                      |
| ------------------ | ------------------------------------------------------------------------------------- |
| **Super Admin**    | Full system administration, user management, system configuration, document oversight |
| **Head Division**  | Review, approve, reject, and monitor documents within the assigned division           |
| **Staff Division** | Create, edit, submit, and manage owned documents                                      |

---

# 🏗 Project Architecture

```text
                 Progressive Web App (PWA)
                          │
                  Next.js Frontend
                          │
                RESTful API (JSON)
                          │
                  Go (Gin Framework)
                          │
                         GORM
                          │
                        MySQL
```

---

# 📁 Project Structure

```text
document_management_system/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   ├── public/
│   ├── types/
│   └── utils/
│
└── backend/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── repositories/
    ├── routes/
    ├── services/
    ├── utils/
    └── config/
```

# Screenshots

## Login

<img width="1690" height="987" alt="image" src="https://github.com/user-attachments/assets/4eaa95eb-7a61-45e0-88a7-0eb04db540bf" />


---

## Dashboard

<img width="1917" height="910" alt="image" src="https://github.com/user-attachments/assets/34c4dee8-dee9-453c-9692-3b5fbbe5e967" />

## Progressive Web App (PWA) icon

<img width="1918" height="850" alt="image" src="https://github.com/user-attachments/assets/f08e46a8-92e2-4290-ad53-e131843df613" />


---
## Create Document Memo
<img width="1918" height="909" alt="image" src="https://github.com/user-attachments/assets/af7a4bda-ca79-45e9-914f-ae7aab31f35d" />

## Document Approval
Approve Document:
<img width="1911" height="789" alt="image" src="https://github.com/user-attachments/assets/df4ee131-45f2-4924-af0c-e8dd3ac92cc2" />
Report Pdf:
<img width="1777" height="904" alt="image" src="https://github.com/user-attachments/assets/19e22c04-ef7a-44e6-93f2-7a6929597d77" />
Scan QR Document:
<img width="1783" height="922" alt="image" src="https://github.com/user-attachments/assets/68699377-cf11-40fc-bd07-f7359c86b357" />
Detail:
<img width="1506" height="921" alt="image" src="https://github.com/user-attachments/assets/b524413d-cc3f-404b-a619-bb174ccdcb71" />

## List Users
<img width="1918" height="958" alt="image" src="https://github.com/user-attachments/assets/aa11df9a-28e4-48aa-a9d2-554c746860a7" />

---

## Golang REST API

<img width="1398" height="769" alt="image" src="https://github.com/user-attachments/assets/9a2a0fa2-b5c8-46e0-b5f0-85aaef4fce3f" />

## Next Js Frontend

<img width="1048" height="274" alt="image" src="https://github.com/user-attachments/assets/347296a0-05de-4663-be3c-2d0cde6c75ff" />




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
