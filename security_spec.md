# RuangRAB Firestore Security Specification

## 1. Access Model & User Isolation
- All data in Firestore is strictly private per authenticated user (`request.auth.uid`).
- `/users/{userId}` can only be read, created, or updated by the owner (`request.auth.uid == userId`).
- `/users/{userId}/projects/{projectId}` can only be read, created, updated, or deleted by the owner (`request.auth.uid == userId`).
- Default admin (`muh.bima.adjie@gmail.com` with `email_verified == true`) also has administrative read/write access for support.

## 2. Schema & Field Validation
- **UserProfile (`/users/{userId}`)**:
  - `uid == userId` (immutable)
  - `fullName` is a non-empty string (`size() <= 120`)
  - `email` is a valid email string (`size() <= 160`)
  - `userType` in `['Student', 'Estimator', 'Other']`
  - `createdAt` and `updatedAt` are strings (`size() <= 60`)
- **ProjectDocument (`/users/{userId}/projects/{projectId}`)**:
  - `id == projectId`
  - `ownerUid == userId` (immutable)
  - `name` is a non-empty string (`size() <= 160`)
  - `floorCount` is a number (`>= 0 && <= 100`)
  - `floors` and `works` are lists
