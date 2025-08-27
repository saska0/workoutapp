# WorkoutApp

Mobile app for tracking climbing-specific workout sessions with a bold, neobrutalism-inspired UI and a Node.js + MongoDB backend. 
Create templates, run sessions with timers, log metrics, and review progress.

- Frontend (Expo / React Native): [workoutapp/](workoutapp/)
- Backend (Node.js / Mongoose): [workoutapp-backend/](workoutapp-backend/)

## Demo

Test the app with [Expo Go](https://expo.dev/go) (iOS/Android) by scanning the QR code.

![Expo EAS QR](./assets/eas-update.svg)
## Features
- JWT auth
- RESTful APIs
- Workout templates (create, edit, copy, select)
- Guided session timer (play/pause/skip, total time)
- Metrics logging (weight, pull-up 1RM, 7s hang 20mm)
- Analytics (trend lines + current stats)
- Calendar + daily agenda of completed sessions

## Tech Stack
- React Native (Expo), React Navigation
- Node.js, Mongoose, JWT
- Typescript
- Jest tests (frontend and backend)

## Getting Started

1) Prerequisites
- npm, Node.js
- Expo Go app or Android/iOS emulator
- MongoDB (local or cloud)

2) Environment
- Backend: create [workoutapp-backend/.env](workoutapp-backend/.env)
  JWT_SECRET=supersecret
  MONGODB_URI=mongodb://localhost:27017/workoutapp

3) Install
- Frontend
  cd workoutapp
  npm install
- Backend
  cd workoutapp-backend
  npm install

4) Run
- Backend (default: 3003)
  cd workoutapp-backend
  npm run dev
- Frontend
  cd workoutapp
  npm start
  (press i for iOS, a for Android, or scan QR with Expo Go)

## Testing
- Frontend
  cd workoutapp
  npm test
- Backend
  cd workoutapp-backend
  npm test

## Repo Layout (brief)
- [workoutapp/src/screens](workoutapp/src/screens): UI flows (sessions, analytics, calendar, templates)
- [workoutapp/src/components](workoutapp/src/components): Reusable UI (buttons, inputs, rows)
- [workoutapp/src/api](workoutapp/src/api): API calls
- [workoutapp-backend/src/routes](workoutapp-backend/src/routes): REST endpoints
- [workoutapp-backend/src/models](workoutapp-backend/src/models): Mongoose models
- [workoutapp-backend/tests](workoutapp-backend/tests): API tests

## TODO
- E2E testing
- Workout timer improvements
	- sound effects 
	- repetition based exercise options
- Settings screen, (preferences, themes, data deletion) 


## License
MIT