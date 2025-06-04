# Auth - Backend

This is the backend of **Auth**, a full-stack authentication system built with Express.js and MongoDB. It handles secure user registration, login, and session management using HTTP-only cookies. The system supports dynamic subdomains like `<shopname>.localhost`, enabling seamless authentication across subdomains.

---

## 🌐 Live API

> https://shopauth-lyart.vercel.app

---

## 🚀 Features

- 🔐 **User Authentication**
  - Register and login endpoints
  - Session token stored in HTTP-only cookies
  - Cross-subdomain authentication using cookies
- 🧾 **JWT-Based Auth**
  - Access and refresh tokens
- 🌍 **Dynamic Subdomain Support**
  - Enables authentication across `<shopname>.localhost`

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Native Driver)
- **Auth Method**: JWT + HTTP-only Cookies
- **Deployment**: Vercel (API)

---

## 🧑‍💻 Installation Guide

### 1. Clone the repository

```bash
git clone https://github.com/sanjitgh/authorization-server-side.git
cd authorization-server-side


- **Note**: Maybe sub domain is't wrok, because i don't have any custom domain right now.🥲
```
