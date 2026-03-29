# 🧙‍♂️ TTRPG Character Builder (Angular Standalone App)

A modern, fully standalone Angular application for creating and managing
TTRPG (D&D 5e-inspired) characters. Built with performance, scalability,
and clean architecture in mind---without using traditional Angular
modules.

------------------------------------------------------------------------

## ✨ Features

-   ⚡ Standalone Angular Architecture (no app.module.ts)
-   🧾 Dynamic Character Creation Flow
-   🧠 Signal-based State Management
-   🎨 Clean UI with Component Isolation
-   🧩 Modular Component Design (kebab-case structure)
-   📱 Responsive Layout with Sidebar Navigation
-   🎭 Designed for TTRPG / D&D-style characters

------------------------------------------------------------------------

## 🏗️ Tech Stack

-   Angular 20+ (Standalone Components)
-   TypeScript
-   Angular Signals
-   Custom CSS

------------------------------------------------------------------------

## 📁 Project Structure

    src/
    │
    ├── app/
    │   ├── basic-info/
    │   │   ├── basic-info.ts
    │   │   ├── basic-info.html
    │   │   └── basic-info.css
    │   │
    │   ├── side-nav/
    │   ├── top-navbar/
    │   ├── hero/
    │   │
    │   ├── services/
    │   │   └── character.ts
    │   │
    │   ├── app.ts
    │   ├── app.html
    │   └── app.css
    │
    └── public/
        └── compendium/
            └── monsters/

------------------------------------------------------------------------

## 🧠 Architecture Overview

### Standalone Components

Each component is self-contained and manages its own imports, improving
scalability and maintainability.

### Signals for State Management

Uses Angular Signals for reactive and efficient state handling without
heavy RxJS usage.

------------------------------------------------------------------------

## 🎮 Core Features

### Basic Info Screen

-   Character name
-   Race selection
-   Class selection

### Navigation

-   Sidebar-based multi-step navigation

### Hero Section

-   Intro / visual section for character overview

### Marquee Section

-   Animated strip for showcasing text or features

------------------------------------------------------------------------

## ⚙️ Performance Notes

Large asset folders (like monster compendium) may slow deployment.
Recommended:

-   Lazy loading assets
-   Image compression
-   External hosting (CDN)

------------------------------------------------------------------------

## 🚀 Getting Started

### Install

    npm install

### Run

    ng serve

Open http://localhost:4200

------------------------------------------------------------------------

## 🧪 Future Improvements

-   Full character sheet system
-   Dice rolling mechanics
-   Save/load functionality
-   API integration
-   Combat system

------------------------------------------------------------------------

## 📜 License

MIT License
