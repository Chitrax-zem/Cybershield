# 🛡️ AI-Powered Malware Detection System

An advanced malware detection platform leveraging deep learning and explainable AI to detect zero-day threats with real-time analysis and comprehensive dashboards.

## 🌟 Features

### 🔐 Authentication & Security
- **JWT-based Authentication**: Secure token-based authentication
- **Role-based Access Control**: User and Admin roles with different permissions
- **Password Hashing**: bcrypt encryption for secure password storage
- **Protected Routes**: Secure API endpoints with middleware

### 🎯 Core AI Malware Detection
- **Deep Learning Model**: CNN + LSTM hybrid architecture for binary classification
- **Zero-Day Detection**: Anomaly detection using Isolation Forest
- **Feature Extraction**: Advanced byte-level analysis including:
  - Byte frequency distribution
  - N-gram pattern analysis (2-grams, 3-grams)
  - Shannon entropy calculation
  - PE header and section analysis
- **Heuristic Analysis**: Suspicious API and string detection

### 🧠 Explainable AI
- **Feature Importance**: Visual breakdown of what contributes to detection
- **Suspicious Byte Highlighting**: Identify unusual byte patterns
- **Model Decision Explanation**: Transparent AI reasoning
- **Risk Factor Analysis**: Detailed threat assessment
- **Confidence Breakdown**: Multi-dimensional confidence scoring

### 📊 Analytics Dashboard
- **Real-time Statistics**: Live malware detection metrics
- **Trend Analysis**: 30-day detection trends visualization
- **User Management**: Admin view of all users and activities
- **Top Malware Tracking**: Most frequently detected threats
- **Interactive Charts**: Pie, bar, and line charts with Recharts

### 💻 Modern Frontend
- **React + TypeScript**: Type-safe development
- **Tailwind CSS**: Responsive, cybersecurity-themed UI
- **Real-time Updates**: Live scanning status and results
- **Drag-and-Drop Upload**: Intuitive file upload interface
- **Glass Morphism Design**: Modern, sleek user interface

## 🏗️ Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **MongoDB**: NoSQL database with Motor (async driver)
- **PyTorch**: Deep learning framework
- **Scikit-learn**: Machine learning utilities
- **JWT**: Authentication tokens

### Frontend
- **React 18**: Modern UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Data visualization library
- **Axios**: HTTP client

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 20+
- MongoDB 4.4+

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Start MongoDB:
```bash
# If using local MongoDB
mongod
```

6. Run the backend server:
```bash
python main.py
```

Backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🚀 Usage

### User Workflow

1. **Sign Up**: Create a new account at `/signup`
2. **Login**: Access the system at `/login`
3. **Upload File**: Drag and drop or select a file (.exe, .apk)
4. **View Results**: See detailed analysis with:
   - Detection result (Malicious/Benign/Suspicious)
   - Confidence score
   - Feature importance
   - Risk factors
   - Zero-day threat indicator
5. **History**: View all past scans in the dashboard

### Admin Workflow

1. **Login as Admin**: Use admin credentials
2. **Access Analytics**: Navigate to `/analytics`
3. **View Statistics**: 
   - Overall scan statistics
   - Detection distribution
   - User management
   - Trend analysis
   - Top malware detection

## 🔧 Configuration

### Backend Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=malware_detection_db

# JWT
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_EXTENSIONS=.exe,.apk
UPLOAD_DIR=uploads
TEMP_DIR=temp

# Security
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# AI Model
MODEL_PATH=ml_model/malware_detector.pth
FEATURE_SIZE=1000
CONFIDENCE_THRESHOLD=0.5
```

### API Endpoints

#### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

#### Scanning
- `POST /api/scan/upload` - Upload file for scanning
- `POST /api/scan/{scan_id}/start` - Start scanning process
- `GET /api/scan/{scan_id}` - Get scan results
- `GET /api/scan/history/my` - Get user's scan history
- `DELETE /api/scan/{scan_id}` - Delete scan

#### Analytics (Admin Only)
- `GET /api/analytics/stats` - Get overall statistics
- `GET /api/analytics/trends` - Get detection trends
- `GET /api/analytics/users` - Get user statistics
- `GET /api/analytics/top-malware` - Get top detected malware
- `GET /api/analytics/recent-scans` - Get recent scans
- `GET /api/analytics/my-stats` - Get user statistics

## 🎨 Features Demonstration

### Malware Detection Flow

1. **File Upload**: User uploads .exe or .apk file
2. **Feature Extraction**: System extracts byte-level features
3. **AI Analysis**: Deep learning model analyzes features
4. **Zero-Day Check**: Anomaly detection for unknown threats
5. **Explainable AI**: Generates detailed explanation
6. **Results Display**: Shows comprehensive analysis

### Explainable AI Features

- **Feature Importance**: Which features contributed most to the decision
- **Suspicious Bytes**: Unusual byte patterns in the file
- **Risk Factors**: Specific indicators of malicious behavior
- **Model Decision**: Clear explanation of AI reasoning
- **Confidence Breakdown**: Multi-dimensional confidence metrics

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt encryption
- **CORS Protection**: Configurable allowed origins
- **File Validation**: Size and type restrictions
- **Role-based Access**: Admin and user permissions
- **Protected Routes**: Middleware for API security

## 📈 Performance

- **Fast Processing**: Sub-10 second scan times for typical files
- **Scalable Architecture**: Async/await for high concurrency
- **Optimized ML Model**: Efficient deep learning inference
- **Database Indexing**: Optimized MongoDB queries
- **Responsive UI**: Fast, reactive frontend updates

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in .env
- Verify MongoDB is accessible on configured port

### Frontend Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 20+)
- Clear Vite cache: `rm -rf .vite`

### Backend Import Errors
- Activate virtual environment
- Install requirements: `pip install -r requirements.txt`
- Check Python version: `python --version` (should be 3.11+)

## 📝 License

This project is for educational and research purposes.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📧 Support

For issues and questions, please open an issue on GitHub.

## 🎯 Roadmap

- [ ] Add more file format support (.dll, .bat, .ps1)
- [ ] Implement real-time threat intelligence feeds
- [ ] Add sandbox execution environment
- [ ] Multi-language support
- [ ] Mobile app version
- [ ] Advanced reporting and PDF export
- [ ] Integration with SIEM systems
- [ ] API rate limiting and throttling

---

**Built with ❤️ using AI and cutting-edge technology**#   C y b e r s h i e l d  
 