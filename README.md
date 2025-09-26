# Manas: The Mindful Pomodoro

A sanctuary for deep focus and mindful productivity. Combine the power of the Pomodoro Technique with mindful thought capturing to transform your work sessions into moments of clarity and purpose.

## Features

### 🧘‍♂️ **Mindful Productivity**
- **Pomodoro Timer**: Customizable focus, short break, and long break durations
- **Thought Capture**: Seamlessly capture thoughts during sessions without breaking focus
- **Session Tracking**: Comprehensive analytics of your productivity patterns
- **Mindful Breaks**: Guided transitions between focus and rest periods

### 🔐 **Authentication & Data Management**
- **Google OAuth**: Quick sign-in with your Google account
- **Traditional Login**: Email and password authentication
- **Data Synchronization**: Your data syncs across all devices when authenticated
- **Offline Support**: Works offline for guest users with local storage

### 📊 **Analytics & Insights**
- **Session Statistics**: Track completed sessions, streaks, and total focus time
- **Peak Productivity**: Identify your most productive hours
- **Thought Journal**: Review and manage captured thoughts
- **Progress Visualization**: Beautiful dashboard with meaningful metrics

### 🎨 **Customization**
- **Theme System**: Multiple animated gradient themes
- **Timer Preferences**: Customize session durations
- **Notification Settings**: Control alerts and reminders
- **Responsive Design**: Works beautifully on all devices

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Animation**: Framer Motion
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: MongoDB with Mongoose ODM
- **Deployment**: Vercel-ready
- **Development**: Turbopack for fast development

## Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Google OAuth credentials (optional, for Google sign-in)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd manas-app
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # NextAuth Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key
   
   # Google OAuth (Get from https://console.developers.google.com/)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Database
   DATABASE_URL=mongodb://localhost:27017/manas-app
   
   # JWT Secret
   JWT_SECRET=your-jwt-secret-key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Setting Up Google OAuth (Optional)

1. Go to the [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy the Client ID and Client Secret to your `.env.local`

## Database Setup

### MongoDB (Recommended)

1. **Local MongoDB**
   ```bash
   # Install MongoDB locally or use Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **MongoDB Atlas (Cloud)**
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a cluster
   - Get connection string
   - Update `DATABASE_URL` in `.env.local`

## Usage

### For Guests (No Account)
- Use the timer immediately
- Data stored locally in browser
- Limited to basic features
- Access settings and themes

### For Authenticated Users
- Full analytics and insights
- Data synchronization across devices
- Persistent thought journal
- Customizable preferences
- Streak tracking and achievements

### Key Workflows

1. **Start a Focus Session**
   - Click "Start" on the main timer
   - Enter the flow state
   - Capture thoughts without breaking focus

2. **Review Your Progress**
   - Visit the Dashboard for analytics
   - Check your streaks and statistics
   - Review captured thoughts

3. **Customize Your Experience**
   - Adjust timer durations in Settings
   - Switch between beautiful themes
   - Configure notifications

## API Reference

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### User Management
- `GET /api/user/stats` - Get user statistics
- `GET/PUT /api/user/preferences` - User preferences

### Sessions
- `GET /api/sessions` - Get user sessions
- `POST /api/sessions` - Create new session

### Thoughts
- `GET /api/thoughts` - Get user thoughts
- `POST /api/thoughts` - Create new thought
- `PUT /api/thoughts/[id]` - Update thought
- `DELETE /api/thoughts/[id]` - Delete thought

## Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy**
   ```bash
   npm run build
   npm start
   ```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Philosophy

**Manas** (Sanskrit: मनस्) represents the mind, the mental faculty where thoughts arise and consciousness operates. This application embodies the principle of mindful productivity - maintaining awareness of our mental state while pursuing focused work.

The integration of thought capture with the Pomodoro Technique creates a unique space where productivity meets mindfulness, allowing users to acknowledge and preserve insights without disrupting their flow state.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Credits

Created with ❤️ by **Rishu Patwari** - A vibe coder passionate about mindful productivity and beautiful user experiences.

Built with the assistance of AI to bring the vision of mindful productivity to life.

---

*"In the space between thoughts lies infinite possibility."*
