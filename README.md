# Parklee - Smart Campus Parking System

Parklee is a modern, real-time parking management solution designed for university campuses. It helps students, staff, and visitors find available parking spots efficiently, view real-time occupancy status, and navigate directly to their chosen zones. The system also includes a comprehensive admin dashboard for managing parking sensors and reported issues.

## 🚀 Features

### For Users
- **Real-time Parking Status**: Live updates on parking availability (Available, Limited, Full) using Server-Sent Events (SSE).
- **Interactive Map**: 3D map interface powered by Mapbox for visualizing parking zones across campus.
- **Smart Navigation**: Integrated turn-by-turn navigation to selected parking zones.
- **Event-based Parking**: Find the best parking spots based on campus events.
- **Issue Reporting**: Users can report problems (e.g., "Zone full", "Sensor broken") directly from the app.
- **"I Parked Here"**: Feature to mark your parking spot.
- **Onboarding Flow**: Guided setup for new users.

### For Administrators
- **Admin Dashboard**: Centralized view of campus parking health.
- **Issue Management**: Track and resolve user-reported issues.
- **Sensor Management**: Monitor and configure parking sensors.

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Maps**: [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) + [React Map GL](https://visgl.github.io/react-map-gl/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

## 📂 Project Structure

```
src/
├── components/       # Reusable UI components (Layouts, UI kit, etc.)
├── hooks/            # Custom React hooks (e.g., useZoneStream)
├── lib/              # Utilities, constants, and helper functions
├── pages/            # Application views
│   ├── admin/        # Admin dashboard pages
│   ├── Home.tsx      # Main user dashboard
│   ├── Map.tsx       # Interactive map view
│   └── ...
├── services/         # API integration and mock services
├── store/            # Global state management (Zustand stores)
└── types/            # TypeScript type definitions
```

## 🏁 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- PostgreSQL database

### Frontend Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd parking
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Mapbox token:
   ```env
   VITE_MAPBOX_TOKEN=your_mapbox_access_token_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`.

### Backend Setup

The backend server is located in the `server/` directory and handles real-time updates and database interactions.

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the `server/` directory with the following variables:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/parklee_db
   SENSOR_API_KEY=your_secure_sensor_api_key
   CLIENT_ORIGIN=http://localhost:5173
   ```

4. Initialize the Database:
   Run the following commands to generate migrations, apply them, and seed initial data:
   ```bash
   npm run generate
   npm run migrate
   npm run seed
   ```

5. Start the server:
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3000`.

## 📜 Scripts

- `npm run dev`: Start the development server.
- `npm run build`: Type-check and build the application for production.
- `npm run lint`: Run ESLint to check for code quality issues.
- `npm run preview`: Preview the production build locally.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
