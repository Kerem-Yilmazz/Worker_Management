# 👷 Worker Management System

A full-stack management application designed to handle employee records, track overtime hours, and manage internal company announcements. Built with the MERN stack (MongoDB, Express, React, Node.js).

---

## 🚀 Key Features

* **Employee Management:** Create, view, update, and delete worker profiles.
* **Overtime Tracking:** Log and calculate extra work hours for each employee.
* **Announcement Board:** Post and manage company-wide notices.
* **Responsive UI:** A clean, modern dashboard built with React.

## 🛠️ Tech Stack

* **Frontend:** React.js
* **Backend:** Node.js, Express.js
* **Database:** MongoDB (Mongoose)
* **Icons & Styling:** FontAwesome / CSS3

---

## 📦 Installation & Setup

Follow these steps to get the project running on your local machine:

### 1. Clone the Repository
```bash
git clone [https://github.com/Kerem-Yilmazz/Worker_Management.git](https://github.com/Kerem-Yilmazz/Worker_Management.git)
cd Worker_Management

2. Install Dependencies
You need to install packages for both the backend and the frontend:

Bash

# Install root/backend dependencies
npm install

# If your frontend is in a separate folder (e.g., /client), go there and install:
# cd client && npm install

3. Environment Variables
Create a .env file in the root directory and add your MongoDB credentials:

Kod snippet'i

PORT=5000
MONGO_URI=your_mongodb_connection_string
4. Run the Application
Start the development server:

Bash

# To run both or the backend
npm start

# If frontend is separate, run it in another terminal
# cd client && npm start
