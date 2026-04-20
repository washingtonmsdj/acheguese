# Achegue-se - Product Requirements Document

## Overview
Achegue-se is a local services marketplace platform that connects users with gastronomy, mobility, classifieds, and professional services in their area.

## Target Users
- Local residents looking for services
- Restaurant owners managing digital menus
- Drivers offering rides/deliveries
- Professionals advertising services
- Business owners managing establishments

## Core Features

### 1. Gastronomy Module
- Browse restaurants and menus
- View reviews and ratings
- Add favorites
- Order food (future)

### 2. Mobility Module
- Request rides
- Request deliveries
- Driver availability management
- Real-time tracking

### 3. Classifieds Module
- Post local ads
- Browse categorized listings
- Contact advertisers

### 4. Professionals Module
- Professional profiles
- Service listings
- Contact and booking

### 5. Business Module
- Business profile management
- Operating hours
- Location and contact info

## Authentication
- Email/password registration
- Google OAuth (optional)
- Role-based access (user, admin, driver, business_owner)

## Key User Flows

### New User Registration
1. User visits /register
2. Fills email, password, name
3. Receives confirmation email
4. Logs in at /login
5. Redirected to /home

### Request a Ride (Mobility)
1. User logs in
2. Goes to /mobility
3. Enters pickup and destination
4. Views available drivers
5. Confirms ride request
6. Tracks driver in real-time

### Browse Restaurants (Gastronomy)
1. User goes to /gastronomy
2. Views list of restaurants
3. Clicks on a restaurant
4. Views menu and reviews
5. Can add to favorites

## Technical Requirements
- Responsive design (mobile-first)
- Fast page loads (<3s)
- Secure authentication
- Real-time updates for mobility
- Map integration for location-based features
