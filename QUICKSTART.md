# 🚀 Quick Start Guide

Get the AI-Powered Malware Detection System up and running in minutes!

## Option 1: Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed

### Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd malware-detection-system
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

4. **Create an admin account**
```bash
# Use the signup page or API to create an account
# The first user will have admin privileges
```

## Option 2: Manual Setup

### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Or use local MongoDB
mongod
```

5. **Run the backend**
```bash
python main.py
```

Backend will be available at http://localhost:8000

### Frontend Setup

1. **Navigate to frontend directory** (in a new terminal)
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

Frontend will be available at http://localhost:5173

## First Time Use

### 1. Create an Account
1. Go to http://localhost:5173/signup
2. Fill in username, email, and password
3. Click "Create Account"

### 2. Login
1. Go to http://localhost:5173/login
2. Enter your credentials
3. Click "Sign In"

### 3. Scan Your First File
1. On the dashboard, click "Select File"
2. Choose a .exe or .apk file
3. Click "Start Scan"
4. Wait for the analysis to complete
5. View detailed results with explainable AI

### 4. View Analytics (Admin Only)
1. Login with an admin account
2. Click "Analytics" in the header
3. Explore the comprehensive statistics and charts

## Testing the System

### Create Test Files

You can test with any .exe or .apk files you have. For testing purposes:
- Use legitimate software for benign samples
- Be cautious with actual malware - use in isolated environment

### API Testing

Use the interactive API docs at http://localhost:8000/docs to test endpoints:
1. Signup: `POST /api/auth/signup`
2. Login: `POST /api/auth/login`
3. Upload: `POST /api/scan/upload`
4. Start Scan: `POST /api/scan/{scan_id}/start`
5. Get Results: `GET /api/scan/{scan_id}`

## Common Issues

### MongoDB Connection Error
**Problem**: Backend can't connect to MongoDB
**Solution**: Ensure MongoDB is running on port 27017
```bash
# Check if MongoDB is running
docker ps | grep mongodb
```

### Frontend Build Error
**Problem**: Frontend fails to build
**Solution**: Clear node_modules and reinstall
```bash
cd frontend
rm -rf node_modules
npm install
```

### Port Already in Use
**Problem**: Port 8000 or 5173 already in use
**Solution**: Change ports in configuration files
```bash
# Backend: Change port in main.py
# Frontend: Change port in vite.config.ts
```

## Environment Configuration

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=malware_detection_db
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:5173
```

### Frontend
The API URL is configured in `vite.config.ts`:
```ts
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

## Next Steps

1. **Explore Features**
   - Try uploading different file types
   - View scan history
   - Check explainable AI results

2. **Admin Dashboard**
   - Create multiple user accounts
   - Monitor system-wide analytics
   - Track detection trends

3. **Customization**
   - Modify the AI model for your needs
   - Add new detection features
   - Customize the UI theme

4. **Production Deployment**
   - Update SECRET_KEY and security settings
   - Configure production MongoDB
   - Set up SSL/HTTPS
   - Configure backup strategies

## Support

- 📖 Full Documentation: See README.md
- 🐛 Report Issues: Open a GitHub issue
- 💡 Feature Requests: Submit a pull request

## Security Notes

⚠️ **Important Security Reminders:**

1. Change the default SECRET_KEY in production
2. Use strong passwords for admin accounts
3. Enable HTTPS in production
4. Configure proper firewall rules
5. Regular security updates
6. Backup your database regularly

---

**Happy Malware Detecting! 🛡️**