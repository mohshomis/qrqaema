# Getting Started Guide

This guide will help you set up your development environment and understand the Restaurant Order System project structure.

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 13+
- Redis (for Celery)
- Git

## System Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/restaurant-order-system.git
cd restaurant-order-system
```

### 2. Backend Setup

#### Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Environment Configuration
Create a `.env` file in the backend directory:
```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True

# Database
DATABASE_URL=postgres://user:password@localhost:5432/restaurant_db
# For development, you can use SQLite:
# DATABASE_URL=sqlite:///db.sqlite3

# Email
EMAIL_HOST_USER=your-email@example.com
EMAIL_HOST_PASSWORD=your-email-password

# DigitalOcean Spaces (or use local storage for development)
AWS_ACCESS_KEY_ID=your-spaces-key
AWS_SECRET_ACCESS_KEY=your-spaces-secret

# Redis
UPSTASH_REDIS_URL=redis://localhost:6379

# Frontend URL
FRONTEND_URL=http://localhost:3000/
```

#### Database Setup
```bash
python manage.py migrate
python manage.py createsuperuser
```

#### Run Development Server
```bash
python manage.py runserver
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Environment Configuration
Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WEBSOCKET_URL=ws://localhost:8000
```

#### Run Development Server
```bash
npm start
```

## Project Structure

### Backend Structure
```
backend/
├── backend/              # Django project settings
├── restaurant/           # Main application
│   ├── models.py        # Database models
│   ├── views/           # API views
│   ├── serializers/     # DRF serializers
│   └── utils/           # Utility functions
├── authentication/       # Authentication app
├── analysis/            # Analytics app
└── manage.py            # Django management script
```

### Frontend Structure
```
frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   │   ├── customer/   # Customer-facing pages
│   │   └── restaurant-owner/  # Admin pages
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   └── locales/        # Translation files
└── package.json
```

## Key Features

### 1. Multi-language Support
The system supports multiple languages:
- English (en)
- Arabic (ar)
- Turkish (tr)
- Dutch (nl)

To add translations:
1. Add keys to `frontend/src/locales/en/translation.json`
2. Copy to other language files and translate

### 2. Authentication System
- JWT-based authentication
- Role-based access control
- Password reset functionality
- Account activation flow

### 3. Restaurant Management
- Profile management
- Menu management
- Staff management
- Table management with QR codes

### 4. Order System
- Real-time order tracking
- Table-based ordering
- Special requests handling
- Order status management

## Development Workflow

### 1. Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push changes
git push origin feature/your-feature-name
```

### 2. Code Style
- Backend: Follow PEP 8
- Frontend: ESLint configuration
- Use meaningful variable names
- Write descriptive commit messages

### 3. Testing
```bash
# Backend tests
python manage.py test

# Frontend tests
npm test
```

### 4. API Documentation
- API documentation available at: `http://localhost:8000/api/docs/`
- Swagger UI: `http://localhost:8000/api/swagger/`

## Common Tasks

### 1. Creating a New API Endpoint
1. Add URL in `restaurant/urls.py`
2. Create view in `restaurant/views/`
3. Create serializer if needed
4. Add tests
5. Update API documentation

### 2. Adding a New Frontend Feature
1. Create component in appropriate directory
2. Add translations
3. Connect to API if needed
4. Add tests
5. Update documentation

### 3. Database Changes
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### 4. Translation Updates
1. Add new keys to `en/translation.json`
2. Run translation script: `npm run translate-sync`
3. Update other language files

## Troubleshooting

### Common Issues

1. Database Connection Issues
```bash
# Check PostgreSQL service
sudo service postgresql status

# Reset database
python manage.py flush
```

2. Frontend Build Issues
```bash
# Clear node modules
rm -rf node_modules
npm install

# Clear cache
npm cache clean --force
```

3. Redis Connection Issues
```bash
# Check Redis service
sudo service redis-server status

# Clear Redis cache
redis-cli flushall
```

### Getting Help
- Check existing documentation in `/docs`
- Review related tests
- Ask in team chat
- Create an issue in repository

## Additional Resources

### Documentation
- [Django Documentation](https://docs.djangoproject.com/)
- [React Documentation](https://reactjs.org/docs/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Tools
- [Django Debug Toolbar](https://django-debug-toolbar.readthedocs.io/)
- [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/)
- [Postman](https://www.postman.com/) for API testing

## Next Steps

1. Review the [Technical Debt](technical_debt.md) document
2. Understand the [Testing Strategy](testing_strategy.md)
3. Check [Future Features](future_features.md) roadmap
4. Set up your development environment
5. Make a small test contribution
