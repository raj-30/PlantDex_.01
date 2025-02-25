# PlantDex 🌿

A mobile-friendly web application for plant identification, collection management, and botanical discovery. Users can scan plants using their phone's camera or upload images to identify plant species and build their digital botanical collection.

## Features

- 📱 Phone camera-based plant scanning and identification
- 🌺 Digital plant card collection system
- 🔍 Plant.id API integration for species recognition
- 📊 Responsive web design for mobile and desktop use
- 🔐 User authentication system
- 💾 PostgreSQL database for data persistence

## Tech Stack

- **Frontend:**
  - React with TypeScript
  - TanStack Query for data fetching
  - Tailwind CSS with shadcn/ui components
  - Wouter for routing

- **Backend:**
  - Express.js with TypeScript
  - PostgreSQL with Drizzle ORM
  - Passport.js for authentication
  - Plant.id API for plant identification

## Prerequisites

- Node.js v20 or higher
- PostgreSQL 15 or higher
- VS Code (recommended)
- Plant.id API key (get it from [here](https://web.plant.id/api-access-key/))

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd plantdex
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/plantdex
   PLANT_ID_API_KEY=your_api_key_here
   SESSION_SECRET=your_session_secret
   ```

4. **Set up the database**
   ```bash
   # Create the database
   createdb plantdex

   # Push the schema to the database
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

## Database Schema

```typescript
// Users table
users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Plants table
plants = pgTable("plants", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  scientificName: text("scientific_name").notNull(),
  imageUrl: text("image_url").notNull(),
  habitat: text("habitat").notNull(),
  careTips: text("care_tips").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

## API Endpoints

### Authentication

- `POST /api/register` - Register a new user
- `POST /api/login` - Log in an existing user
- `POST /api/logout` - Log out the current user
- `GET /api/user` - Get the current user's information

### Plants

- `GET /api/plants` - Get all plants for the current user
- `GET /api/plants/:id` - Get a specific plant
- `POST /api/plants` - Create a new plant (with image identification)
- `DELETE /api/plants/:id` - Delete a plant

## Development

### Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   └── pages/        # Page components
├── server/
│   ├── auth.ts          # Authentication setup
│   ├── plant-id.ts      # Plant.id API integration
│   ├── routes.ts        # API routes
│   └── storage.ts       # Database operations
└── shared/
    └── schema.ts        # Database schema and types
```

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm run db:push` - Push schema changes to the database

### VS Code Extensions

For the best development experience, install these VS Code extensions:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

### Code Style

The project uses ESLint and Prettier for code formatting. Format your code before committing:

```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
