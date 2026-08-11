# 🤖 AI Calling Agent

An intelligent, automated system built to handle AI-based calling, WhatsApp messaging, and restaurant order management. This project leverages the power of Next.js, BullMQ, and OpenWA to provide a robust background-job processing architecture for real-time notifications and automated communications.

## 🚀 Key Features

- **Automated Communication:** Programmatic WhatsApp messaging integration via [OpenWA](https://github.com/open-wa/wa-automate-nodejs).
- **Background Job Processing:** Highly reliable queue management using **BullMQ** & **Redis** for calls and WhatsApp messages.
- **Restaurant Management Dashboard:** Interfaces for managing Restaurant Settings, Swiggy/Zomato order details, and comprehensive reporting.
- **Queue Monitoring:** Integrated Bull Board dashboard to monitor active, pending, and failed background jobs.
- **Modern Tech Stack:** Built with Next.js (App Router), React, Tailwind CSS, and MongoDB (via Mongoose).

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, React Query
- **Backend:** Next.js API Routes, Node.js
- **Database:** MongoDB (Mongoose)
- **Queues & Workers:** BullMQ, Redis, Bull-Board (for UI monitoring)
- **Integrations:** OpenWA (WhatsApp Web automation), AWS S3

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- [Redis](https://redis.io/) (Must be running locally or accessible via URL for BullMQ to function)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)

---

## 📦 Installation & Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone https://github.com/ajitkushwaha2806/ai-calling-agent.git
   cd ai-calling-agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and add your required configuration variables (e.g., MongoDB URI, Redis URL, OpenWA credentials, etc.).

4. **Initialize OpenWA Configuration:**
   Inside the `openwa` folder, make sure the `.env` is configured correctly based on the provided `.env.minimal` template.

---

## 🚀 Running the Application

This project runs several processes simultaneously (Next.js server, WhatsApp worker, Calls worker, and BullMQ dashboard). You can start them all with a single command using `concurrently`:

```bash
npm run dev
```

### Individual Scripts

If you need to run specific services individually, you can use the following commands:

- **Start the Next.js Frontend/API:**
  ```bash
  npm run dev:next
  ```
- **Start the OpenWA Service:**
  ```bash
  npm run dev:openwa
  ```
- **Start the Calls Queue Worker:**
  ```bash
  npm run dev:worker:calls
  ```
- **Start the WhatsApp Queue Worker:**
  ```bash
  npm run dev:worker:whatsapp
  ```
- **Start the BullMQ Dashboard:**
  ```bash
  npm run dev:dashboard
  ```

---

## 📁 Project Structure

```text
ai-calling-agent/
├── app/                  # Next.js App Router (Pages & API Routes)
├── components/           # Reusable React UI Components (Reporting, Settings, etc.)
├── bullmq/               # BullMQ configurations, jobs, and worker scripts
├── openwa/               # WhatsApp Web automation service and configuration
├── models/               # Mongoose Database Schemas
├── services/             # Core business logic (OpenWA service, etc.)
├── lib/                  # Utility functions (WhatsApp utils, etc.)
└── public/               # Static assets
```

---

## 📊 Queue Dashboard

Once you have started the application using `npm run dev`, you can monitor your active queues, delayed jobs, and failed tasks through the BullMQ dashboard (typically available on a specific port set in `bullmq/dashboard.js`).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check [issues page](https://github.com/ajitkushwaha2806/ai-calling-agent/issues).
