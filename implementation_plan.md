# Refactor Frontend Flow & Layout

This plan outlines the steps to refactor the `frontend-pwa` UI flow based on the provided sample flow and prompt specifications. The goal is to transition to a sidebar-based layout, integrate advanced mapping features (Google Maps for UI, OpenStreetMap for distances), and enhance key user journeys while preserving the project's strict design system (Eco Tropical Glow colors).

## User Review Required

> [!WARNING]  
> **Layout Shift**: The application will shift from a traditional top-navbar (`AppShell`) to a persistent Sidebar layout as demonstrated in the `sample flow`.
> **Mapping Services**: We will use Google Maps for visual rendering and OpenStreetMap (OSM) for distance/routing calculations. You will need to ensure a valid Google Maps API Key is available in the environment variables (e.g., `VITE_GOOGLE_MAPS_API_KEY`).

## Open Questions

> [!IMPORTANT]
> 1. **Sidebar Navigation**: The prompt mentions "tìm kiếm homestay (ra trang list homestay), trải nghiệm chuyến đi, list các địa điểm du lịch, list các cuisine, thông tin cá nhân". Should the "Home" page be separate from "Tìm kiếm", or does the search filter live on the Home page and redirect to the List page? (I will assume Home contains the search filter, and the sidebar has a link to Home).
> 2. **Map Integration**: Are we using `@react-google-maps/api` or `vis.gl/react-google-maps` for the Google Maps implementation?

## Proposed Changes

---

### Phase 1: Core Layout & Routing

Switch from the current Top-Nav/Footer structure to a full-height Sidebar layout.

#### [MODIFY] `src/routes/AppRoutes.tsx`
Update routing to align with the new sidebar navigation structure, supporting paths like `/`, `/search`, `/homestays/:id`, `/experiences`, `/attractions`, `/cuisine`, and `/profile`.

#### [NEW] `src/components/layout/SidebarLayout.tsx`
Create a new layout wrapper featuring the left sidebar with navigation links and a main content area.

#### [DELETE] `src/components/layout/AppShell.tsx`
Remove the old top-nav based layout (or keep it only for specific portal pages if needed, but replace it as the primary app layout).

---

### Phase 2: Homepage Redesign

Implement the unauthenticated homepage according to the new specifications.

#### [MODIFY] `src/pages/HomePage.tsx`
- **Hero Section**: Add a prominent search filter form (Location, Dates, Guests).
- **Attractions Section**: Display information about local attractions.
- **Popular Destinations**: Show trending destinations based on the current season.
- **Suggested Homestays**: Display a horizontal list or grid of 7-8 sample homestays.

---

### Phase 3: Search Results (List Homestay)

Build the search results page with integrated map functionality.

#### [MODIFY] `src/pages/HomestayListPage.tsx`
- **Homestay Cards**: Redesign cards to show name, amenities, contact, and rating.
- **Advanced Filters**: Add a supplementary filter section (amenities, price).
- **Google Maps View**: Implement a button to "View on Map" which toggles or displays a Google Map plotting all matching homestays.

#### [NEW] `src/services/mapService.ts`
Implement logic to query OpenStreetMap (OSM) for distance calculations between coordinates, while keeping Google Maps strictly for UI rendering.

---

### Phase 4: Homestay Detail Page

Enhance the detail page with comprehensive information and surrounding context.

#### [MODIFY] `src/pages/HomestayDetailPage.tsx`
- **Core Info**: Display image gallery, homestay details, and contact info clearly.
- **Room Availability**: Integrate the room list and availability calendar directly into the page.
- **Surrounding Services**: Add a section for nearby transport, restaurants, and rentals. Include a radius slider (e.g., 1km, 5km) to filter these services.
- **Interactive Map**: Embed a Google Map centered on the homestay, plotting nearby services and attractions. Use OSM to calculate and display distances to these points.

## Verification Plan

### Automated Tests
- Run `npm run lint` and `tsc --noEmit` to ensure no TypeScript or ESLint errors are introduced.

### Manual Verification
1. **Layout**: Verify the sidebar collapses and expands correctly on different screen sizes.
2. **Search Flow**: Submit a search from the Homepage and verify it navigates to the List page with correct query parameters.
3. **Map Rendering**: Verify Google Maps loads correctly on the List and Detail pages.
4. **Distance Calculation**: Verify the distance shown for surrounding services on the Detail page is accurate (via OSM).
