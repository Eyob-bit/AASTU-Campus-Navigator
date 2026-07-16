# AASTU Campus Navigator — Client

Production frontend for the AASTU Campus Navigator platform.

## Technology Stack

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Axios
- TanStack Query (React Query)
- React Hook Form
- Zod
- Leaflet (campus map)
- Marzipano (360° panorama viewer)

## Getting Started

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173` and proxies API requests to `http://localhost:5000`.

## Project Structure

```
src/
├── api/           Axios client and HTTP helpers
├── components/    UI modules (common, map, panorama, search, navigation)
├── hooks/         TanStack Query hooks and feature hooks
├── layouts/       App shell, providers, and route layouts
├── lib/           Shared app libraries (query client)
├── pages/         Route-level screens
├── schemas/       Zod validation schemas
├── services/      API service functions
├── store/         Client-side app state
├── types/         Shared TypeScript types
└── utils/         Utility helpers
```
