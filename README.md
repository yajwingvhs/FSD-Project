# SkillSwap – Student Skill Exchange Platform

SkillSwap is a simple, responsive MERN stack web application built for peer-to-peer student learning. Students can register with their college details, list skills they can teach, search and filter skills shared by other students, send skill exchange requests, and accept or reject incoming requests.

**Example Workflow:**
- **Rahul** knows **Python** and wants to learn **Photoshop**.
- **Priya** knows **Photoshop** and wants to learn **Python**.
- Rahul explores skills, finds Priya's **Photoshop** card, and sends a **Skill Exchange Request** offering **Python**.
- Priya logs in, opens **My Requests**, and clicks **Accept** or **Reject**.

---

## Project Structure

```
FSD Project/
├── backend/
│   ├── node_modules/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── requests.js
│   │   └── skills.js
│   ├── .env
│   ├── .env.example
│   ├── middleware.js
│   ├── models.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── RequestModal.jsx
│   │   │   └── SkillCard.jsx
│   │   ├── pages/
│   │   │   ├── AddSkillPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ExploreSkillsPage.jsx
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── RequestsPage.jsx
│   │   ├── api.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Setup Instructions

### 1. Configure MongoDB Atlas Connection

Open `backend/.env` and replace `<db_password>` with your actual MongoDB Atlas database user password:

```env
PORT=5000
MONGO_URI=mongodb+srv://yajwingvhs_db_user:<db_password>@cluster0.6kog4xv.mongodb.net/
SESSION_SECRET=skillswap_secret_key_2026
CLIENT_URL=http://localhost:5173
```

> **Note:**
> - `backend/.env` is listed in `.gitignore` so your password is never pushed to Git.
> - See `backend/.env.example` as a template.
> - If your password contains special characters like `@`, `#`, or `$`, URL-encode them (e.g., `@` becomes `%40`).
> - In MongoDB Atlas, ensure **Network Access** allows your current IP address (or `0.0.0.0/0` for demo testing).

### 2. Install Dependencies (if not already installed)

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Run Both Applications

Open **two terminals**:

**Terminal 1 – Start Backend (`http://localhost:5000`):**
```bash
cd backend
npm start
```

**Terminal 2 – Start Frontend (`http://localhost:5173`):**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## REST API Endpoints (`backend/routes/`)

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| Health | `GET` | `/api/health` | Server and MongoDB status |
| Auth | `POST` | `/api/register` | Register a new student (hashes password) |
| Auth | `POST` | `/api/login` | Validate credentials & start session |
| Auth | `POST` | `/api/logout` | Destroy session & clear cookies |
| Auth | `GET` | `/api/me` | Check current logged-in session |
| Dashboard | `GET` | `/api/dashboard` | Aggregated counts using MongoDB `aggregate()` |
| Skills | `POST` | `/api/skills` | Add a new skill |
| Skills | `GET` | `/api/skills` | List skills (`?search=`, `?category=`, `?sort=`, `?limit=`, `?mine=`) |
| Skills | `GET` | `/api/skills/:id` | Get a single skill by ID (route param) |
| Skills | `PUT` | `/api/skills/:id` | Update a personal skill |
| Skills | `DELETE` | `/api/skills/:id` | Delete a personal skill |
| Requests | `POST` | `/api/requests` | Send a skill exchange request |
| Requests | `GET` | `/api/requests` | Get sent and received requests |
| Requests | `PUT` | `/api/requests/:id` | Accept or reject an incoming request |
| Profile | `GET` | `/api/profile` | Get logged-in student's profile |
| Profile | `PUT` | `/api/profile` | Update student profile details |

---

## Full Stack Development Syllabus Concepts Mapped

### Express.js & Backend
- **Express Routing & HTTP Methods:** Implemented `GET`, `POST`, `PUT`, and `DELETE` endpoints across `backend/routes/auth.js`, `backend/routes/skills.js`, and `backend/routes/requests.js`, mounted in `backend/server.js`.
- **Route Parameters:** `req.params.id` used in `GET /api/skills/:id`, `PUT /api/skills/:id`, `DELETE /api/skills/:id`, and `PUT /api/requests/:id`.
- **Query Parameters:** `req.query` (`search`, `category`, `sort`, `limit`, `mine`) used in `GET /api/skills` and `GET /api/requests`.
- **Middleware:** Built-in `express.json()`, third-party `cors()`, `cookieParser()`, `express-session`, custom request logger middleware in `backend/server.js`, and `requireAuth` route-protection middleware in `backend/middleware.js`.
- **Cookies & Sessions:** `express-session` stores `req.session.userId` with HTTP-only session cookie `connect.sid`, and `cookie-parser` reads/sets the `skillswap_user` cookie.
- **Authentication:** `bcryptjs` hashes passwords before saving and compares hashed passwords on login.

### MongoDB & Mongoose
- **Connectivity:** `mongoose.connect(MONGO_URI, { dbName: 'skillswap' })`.
- **Schemas & References:** `User`, `Skill` (`userId` ref `'User'`), and `Request` (`senderId`, `receiverId` ref `'User'`) defined in `backend/models.js`.
- **CRUD Operations:** `create()`, `find()`, `findById()`, `findByIdAndUpdate()`, `save()`, `findByIdAndDelete()`.
- **Queries, Sorting & Limiting:** Regex search (`$or`), category filter, `.sort({ skillName: 1 })`, `.limit(3)` for Featured Skills, and `.populate()` to join student details.
- **Aggregation:** `GET /api/dashboard` uses `Skill.aggregate([{ $match }, { $count }])` and `Request.aggregate([{ $match }, { $group }])` to calculate dashboard statistics.

### React.js & Frontend (`frontend/src/`)
- **JSX & Functional Components:** Reusable components in `src/components/` (`Navbar`, `Footer`, `SkillCard`, `RequestModal`) and pages in `src/pages/` (`HomePage`, `RegisterPage`, `LoginPage`, `DashboardPage`, `AddSkillPage`, `ExploreSkillsPage`, `RequestsPage`, `ProfilePage`).
- **Props & State:** Data passed via props (`skill`, `currentUser`, `onRequestClick`, `onLoginSuccess`) and managed with `useState`.
- **React Hooks (`useState`, `useEffect`):** Session check on mount, fetching skills, dashboard aggregation, debounced search, and requests loading.
- **Conditional Rendering & Lists:** Auth-aware navigation, empty states, status badges, and `.map()` rendering for skill cards and exchange requests.
- **React Forms & Event Handling:** Controlled inputs (`value` + `onChange`) and `onSubmit` handlers.
- **React Router & Axios:** `BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`, `Navigate`, `useNavigate`, `useLocation`, plus Axios `withCredentials: true` for session cookies.

---

## Important Viva Questions & Answers

1. **What is the MERN stack?**
   - **M**ongoDB (NoSQL database), **E**xpress.js (Node.js backend web framework), **R**eact.js (frontend UI library), and **N**ode.js (JavaScript runtime environment).

2. **Why do we use Mongoose instead of raw MongoDB queries?**
   - Mongoose provides schema definitions, validation rules, `ObjectId` references (`ref` + `.populate()`), and clean methods like `.find()`, `.create()`, and `.findByIdAndUpdate()`.

3. **How are passwords stored securely in SkillSwap?**
   - Using `bcryptjs` (`bcrypt.hash(password, 10)`), passwords are salted and hashed into an irreversible string before saving to MongoDB. During login, `bcrypt.compare()` verifies the entered password against the stored hash.

4. **How does session-based authentication work with `express-session` and `cookie-parser`?**
   - On login, the server stores `req.session.userId` in server memory and sends a session ID cookie (`connect.sid`) to the browser. On subsequent requests, Axios sends `withCredentials: true`, and `express-session` + `cookie-parser` restore the session so `requireAuth` knows which student is logged in.

5. **What is the difference between Route Parameters and Query Parameters?**
   - **Route parameters** (`req.params.id`, e.g., `/api/skills/:id`) identify a specific resource. **Query parameters** (`req.query.search`, e.g., `/api/skills?search=python&sort=az`) are optional key-value filters after `?`.

6. **What is Express Middleware? Which middleware did you use?**
   - Middleware functions execute between receiving a request and sending a response (`(req, res, next)`). SkillSwap uses `cors()`, `express.json()`, `cookieParser()`, `session()`, a custom logger, and `requireAuth`.

7. **Where did you use MongoDB Aggregation?**
   - In `GET /api/dashboard`, `Skill.aggregate()` counts the user's offered skills with `$match` and `$count`, and `Request.aggregate()` groups exchange requests by `status` using `$match`, `$group`, and `$sum`.

8. **What is `.populate()` in Mongoose?**
   - `.populate('userId', 'name department college')` replaces an `ObjectId` reference in `Skill` or `Request` with the corresponding student document's name, department, and college from the `User` collection.

9. **Why is `withCredentials: true` required in Axios and `credentials: true` in CORS?**
   - Because the React frontend runs on port `5173` and Express runs on port `5000` (different origins). Without `credentials: true` on CORS and `withCredentials: true` on Axios, the browser will not send or store session cookies across ports.

10. **What is the difference between `useState` and `useEffect` in React?**
    - `useState` stores reactive component data (such as form inputs, skills list, or logged-in user), while `useEffect` runs side effects after render (such as fetching skills from `/api/skills` or checking `/api/me` on initial load).

<!-- 
PORT=5000
MONGO_URI=mongodb+srv://yajwingvhs_db_user:sivayaju2@cluster0.6kog4xv.mongodb.net/
SESSION_SECRET=skillswap_secret_key_2026
CLIENT_URL=http://localhost:5173
 -->