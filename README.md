
# 🌱 Farming Super Website – Backend

This is the backend server for the **Farming Super Website**, built with **Node.js**, **Express**, **MongoDB**, and **Google OAuth2 authentication**.

---

## 🚀 Features

* **Authentication**

  * Email/Password login & registration
  * Google OAuth2 login
  * JWT-based session handling

* **User Management**

  * Profile endpoint (protected by JWT)
  * Admin-only user listing

* **File Uploads**

  * `/api/upload` for handling uploads

* **Contact Us API**

  * Users can submit queries via `/api/contact-us`
  * Admins can fetch all messages via `/api/admin/contact-us`

* **Security**

  * Helmet for HTTP headers
  * CORS configured for local frontend

---

## 🛠️ Tech Stack

* **Backend Framework**: Node.js + Express
* **Database**: MongoDB (via Mongoose)
* **Auth**: JWT + Google OAuth2
* **Security**: Helmet, bcryptjs
* **Others**: nanoid, cors

---

## ⚙️ Installation

1. Clone the repository:

```bash
git clone <your_repo_url>
cd folder_name
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root with the following:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/farming-website
JWT_SECRET=your-secret-key

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## ▶️ Running the Server

```bash
npm start
```

The server will start at:

```
http://localhost:3000
```

---

## 🔑 API Endpoints

### Authentication

* **POST** `/api/auth/register` → Register with email/password
* **POST** `/api/auth/login` → Login with email/password
* **GET** `/api/auth/google` → Redirect to Google OAuth
* **GET** `/api/auth/google/callback` → Google OAuth callback
* **GET** `/api/auth/status` → Check authentication system status

### User

* **GET** `/api/profile` → Get logged-in user profile (JWT required)
* **GET** `/api/admin/users` → Admin-only list of all users (JWT + Admin role required)

### Contact Us

* **POST** `/api/contact-us` → Submit a query

  **Payload format:**

  ```json
  {
    "name": "Swati Jain",
    "email": "swati.jain@example.com",
    "phone_number": "+91-9876543210",
    "message": "I would like to know more about your farming services."
  }
  ```

* **GET** `/api/admin/contact-us` → Admin-only fetch all messages

### Uploads

* **POST** `/api/upload` → Upload files
* **Static files** served at `/uploads`

---

## 🔐 Middleware

* `authenticateToken` → Validates JWT
* `requireAdmin` → Restricts access to admin routes


This project is for educational/demo purposes.

---

👉 Do you want me to also create a **Postman collection JSON** for all these APIs (ready to import & test)?
