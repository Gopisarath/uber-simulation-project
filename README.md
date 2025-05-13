# Uber Simulation Project

This is a full-stack distributed system simulating an Uber-like ride-hailing platform.

## 📁 Project Structure

uber-simulation-project/
├── frontend/ # HTML, JS, UI for all roles
├── backend/ # Microservices for customer, driver, ride, billing, admin, ML prediction



## 🔑 Features

✅ Role-based login/signup (Customer, Driver, Admin)  
✅ Ride booking/edit/cancel + driver assignment  
✅ Fare prediction (ML + fallback)  
✅ Kafka message-based microservice communication  
✅ Redis caching for optimization  
✅ MongoDB for all services  
✅ Admin panel to view users and bills  
✅ Fully working billing system + payment  

## 🚀 How to Run

1. **Frontend**:  
   - Open `frontend/index.html` in browser  
   - OR run a local server (e.g. VSCode Live Server)

2. **Backend**:  
   - Start each microservice using `node src/index.js`
   - Ensure Kafka, Redis, MongoDB are running

