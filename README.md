# Cloud Cost Management & Optimization System

An intelligent, multi-service platform designed to monitor AWS Free Tier usage and provide AI-driven cost optimization insights. This project demonstrates a polyglot microservices architecture, integrating Java, C#, and React with Google's Gemini AI.

---

## 🏗️ Technical Architecture

The system is built using a **Microservices Architecture** to ensure scalability and separation of concerns:

| Component | Technology | Responsibility | Port |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, Tailwind, Shadcn/UI | Dashboard & AI Chat Interface | 5173 |
| **Auth Service** | Java 17, Spring Boot, MySQL | User Management & AI Gateway | 8080 |
| **Analytics Service** | C# .NET 8, AWS SDK | AWS Free Tier Usage Tracking | 7188 |
| **Database** | MySQL Workbench | Persistent storage for User Profiles | 3306 |
| **AI Brain** | Google Gemini 1.5 Flash | Natural Language Insights | Cloud |

---

## 🚀 Key Features

* **Multi-Cloud Analytics:** Real-time tracking of AWS Free Tier usage (EC2, S3, RDS) via a dedicated .NET service.
* **AI Cost Assistant:** Integrated Google Gemini AI to provide personalized optimization suggestions and answer complex billing queries.
* **Unified Auth & Profiles:** Secure JWT-based authentication managed by Spring Boot with MySQL persistence.
* **System Health Monitoring:** A built-in health check dashboard in the UI to monitor the status of both backends simultaneously.
* **Responsive UI:** A modern dark-mode enabled dashboard built with Shadcn/UI and Framer Motion.

---

## 🛠️ Installation & Setup

### 1. Prerequisites
* Java JDK 17+
* .NET 8.0 SDK
* Node.js (v18+)
* MySQL Workbench
* AWS Access Key (for Free Tier tracking)
* Google Gemini API Key

### 2. Backend Setup (Java)
1.  Import the project into your IDE (Eclipse/IntelliJ).
2.  Update `src/main/resources/application.properties` with your MySQL credentials and Gemini API Key.
3.  Ensure the `SecurityConfig.java` permits health and auth endpoints.
4.  Run the application.

### 3. Backend Setup (C#)
1.  Open the solution in Visual Studio.
2.  Update `appsettings.json` or Environment Variables with your AWS Access Key and Secret.
3.  Ensure the JWT shared secret matches the Java service.
4.  Run the application (Defaults to `https://localhost:7188`).

### 4. Frontend Setup (React)
1.  Navigate to the frontend folder: `cd frontend`.
2.  Install dependencies: `npm install`.
3.  Create a `.env` file in the root:
    ```env
    VITE_AUTH_API_URL=http://localhost:8080
    VITE_ANALYTICS_API_URL=https://localhost:7188
    ```
4.  Start the dev server: `npm run dev`.

---

## 📊 API Endpoints

### Auth & AI (Java - Port 8080)
* `POST /auth/login` - User authentication.
* `POST /assistant/chat` - Interaction with Gemini AI.
* `GET /actuator/health` - Spring Boot health status.

### Analytics (C# - Port 7188)
* `GET /api/cost/free-tier-status` - Fetches AWS usage data.
* `GET /cost/health` - .NET middleware health status.

---

## 🛡️ Security
* **JWT (JSON Web Tokens):** Shared secret-key authentication between Java and C# services.
* **CORS:** Configured to allow secure requests from the React frontend port.
* **Stateless Architecture:** All API requests are verified per-call for maximum security.

---

## 🤖 AI Assistant Capabilities
The built-in assistant is configured as a **Cloud Cost Expert**. It provides:
* Explanation of current AWS spending.
* Proactive alerts for Free Tier limit thresholds.
* Optimization strategies for storage and compute.
* SQL and CLI command generation for cloud management.

---

## 👨‍💻 Project Highlights (CDAC Submission)
* **Interoperability:** Demonstrated seamless communication between a Spring Boot (Java) and ASP.NET Core (C#) backend.
* **Real-time Integration:** Direct integration with AWS SDK for live data fetching.
* **Modern AI:** Implementation of Google's latest Gemini 1.5 Flash model for intelligent user interaction.