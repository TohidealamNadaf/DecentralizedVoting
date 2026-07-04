# Decentralized Voting System

A robust, secure, and verifiable decentralized voting application built with modern web technologies. This system allows organizers to create polls and enables eligible voters to cast their votes anonymously while ensuring the immutability and verifiability of the voting process using cryptographic principles.

## 🚀 Features

- **Anonymous Voting:** Voters are authenticated via secure tokens without linking their identity to their vote.
- **Cryptographic Security:** 
  - ECDSA (`secp256k1`) for generating poll-specific key pairs.
  - SHA-256 for hashing and creating an immutable chain of votes.
  - Digital signatures to verify vote authenticity.
- **Immutable Vote Log:** Each vote is cryptographically linked to the previous one (hash chaining), making it impossible to tamper with the voting history without detection.
- **Role-Based Access Control:** Separate roles for organizers (to create and manage polls) and admins.
- **Modern UI/UX:** Built with React, Tailwind CSS, Radix UI components, and Framer Motion for a responsive and accessible user experience.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Radix UI, React Hook Form, Wouter.
- **Backend:** Node.js, Express, TypeScript, Passport.js (Authentication).
- **Database:** PostgreSQL (via Neon Serverless), Drizzle ORM.
- **Cryptography:** Node.js native `crypto` module.

## 📂 Project Structure

- `/client` - Frontend React application (components, pages, hooks, styling).
- `/server` - Backend Express server, routing, and cryptographic services (`crypto.ts`).
- `/shared` - Shared TypeScript schema and types (`schema.ts`) using Drizzle ORM and Zod.

## 🏁 Getting Started

### Prerequisites

- Node.js (v20+ recommended)
- PostgreSQL database (or Neon Database connection string)

### Installation

1. Navigate to the project directory:
   ```bash
   cd DecentralizedVoting
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your database URL:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   ```

4. Push the database schema:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 License

This project is licensed under the MIT License.
