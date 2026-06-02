# Howler

Howler is a specialized social networking platform designed for the University of Washington student community. It enables students to connect, share updates, and engage in campus discussions in real time.

## Tech Stack

* **Frontend:** Next.js (App Router), React, TypeScript
* **Styling:** Tailwind CSS
* **Backend:** Supabase (Authentication, PostgreSQL, Realtime Subscriptions)
* **Data Fetching:** Next.js Server Actions and Optimistic UI updates

---

## Core Features

* **Campus Community:** A dedicated space tailored for UW student interactions.
* **Discussion Threads:** Support for creating posts, nested replies, and managing discussion feeds.
* **Real-time Feeds:** Live updates for interactions and posts utilizing Supabase real-time listeners.
* **Optimistic UI:** Instant client-side updates for actions like liking and posting to ensure low perceived latency.
* **Profile Management:** Custom user profiles with editable details and avatar support.

---

## Architecture and Design Choices

### Server-Side Mutations
The application utilizes Next.js Server Actions to handle form submissions and data mutations. This approach eliminates the need for separate API routes, keeping the data layer closely coupled with the UI and allowing for secure, server-side execution.

### Database Schema
Data is persisted in a Supabase PostgreSQL instance. The schema enforces relational integrity with explicit foreign key constraints mapping user profiles to posts and comments, ensuring performant joins and data consistency.

---

## Getting Started

### Prerequisites
* Node.js (v18 or higher)
* A Supabase project instance


