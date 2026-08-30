# Project Overview

## What GigCircle Is

GigCircle is a full-stack cooperative gig services platform built for Smart India Hackathon. It connects customers with verified local workers for household and community services while keeping pricing, earnings, and platform fees transparent.

## Problem Statement

Many local service marketplaces are fragmented, opaque, or worker-unfriendly. GigCircle aims to solve that by offering:

- trusted customer-to-worker matching
- cooperative-style revenue distribution
- transparent job lifecycle tracking
- governance tools for platform administrators

## Primary User Roles

### Customer

- register and log in
- create service requests
- track request and job status
- receive notifications
- submit ratings and reviews

### Worker

- register and maintain a worker profile
- define skills, location, categories, and availability
- browse matched jobs
- accept and complete work
- track earnings and ratings

### Admin

- review platform activity
- monitor users, workers, requests, jobs, and ratings
- activate or deactivate workers
- inspect cooperative revenue metrics

## Core Features in the Repository

- JWT-based authentication and role-based access control
- service request creation and cancellation
- worker profile management
- worker matching and job acceptance
- job lifecycle management
- rating and review flow
- earnings calculation with platform fee handling
- notification system
- admin dashboards and governance endpoints

## Tech Stack

- Frontend: React, TypeScript, Vite, Axios, Tailwind CSS, Radix UI
- Backend: Spring Boot, Spring Security, Spring Data JPA, Maven
- Database: PostgreSQL
- Auth: JWT

## Current Repository Layout

- `frontend/` contains the client application
- `backend/` contains the Spring Boot API
- `scripts/` contains helper scripts for local verification
- `docs/` contains contributor documentation

## Who Should Read This

- new contributors joining the project
- hackathon teammates preparing demos or fixes
- maintainers reviewing scope and responsibilities
