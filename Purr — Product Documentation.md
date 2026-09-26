# Purr — Product Documentation

Sep 25, 2026 · @Shivam

## Overview

Purr is a QR-code-based pet identity app: every registered pet gets a scannable tag (worn on a collar/belt) that resolves to a living profile page. Scanning it does two different jobs depending on context — it's a shareable social profile for the pet day-to-day, and it becomes a one-tap emergency recovery tool the moment the pet goes missing.

The product is built around one insight: most pet ID tags stop at "here's a static contact card." Purr instead ties the QR to a **status-aware page** — the same scan shows different actions depending on whether the pet is marked Indoor or Missing, and lets any stranger who finds the pet act immediately without installing an app or knowing the owner.

## Problem & value proposition

India has a large population of community-fed and semi-owned street cats/dogs, and even fully-owned pets routinely slip a leash or a gate. When a pet goes missing, the person most likely to find it is a stranger with no way to identify the owner and no incentive to go out of their way to help. Formal microchipping and pet registries are not the norm.

Purr removes the friction on both sides of that moment:

- **For the owner:** peace of mind that any finder can reach them instantly, plus a lightweight social layer (friends/caretakers posting sightings) that works even while the pet isn't lost.
- **For the finder:** a zero-install way to help — scan, see the pet is missing, tap once to share location or find a vet, without adopting the animal or hunting for a phone number.

## User roles & identity model

Purr has two distinct personas sharing the same pet page, with two different levels of identity verification:

| Role | Onboarding | Verification | Can do |
| --- | --- | --- | --- |
| Owner | Phone number + OTP | Verified via SMS OTP | Register a pet, edit its profile, toggle Missing/Indoor status, delete any post or comment on their pet's page |
| Finder / friend | Types a display name only | Not verified — no uniqueness or identity check | Comment on posts, upload sighting photos, use the missing-pet emergency actions (share location, find vets) |

The owner's phone number captured at OTP login doubles as the number used in the "Share Location on WhatsApp" emergency flow, so it is effectively a public-facing contact number once a pet is marked Missing.

A finder's typed name is a display convenience, not a verified identity — anyone can type any name. This is an accepted trade-off for keeping the finder flow frictionless; it means comment/post authorship on a pet's page should be treated as unverified.

## Core flow 1: Onboarding & registration

1. **Splash** — "PURR: Your Pet's Town" branding screen.
2. **Phone entry** — owner enters phone number, taps Continue.
3. **OTP verification** — 6-digit code, with a resend option.
4. **Pet profile form** — photo upload, owner's name, local address (the pet's home location, used later for "nearby" context), pet's name, pet species (chip selector: Cat/Dog/Rabbit/Cow/Other), and an optional Bio field (personality description — replaces an earlier, removed "color/unique marks" field).
5. **QR generation** — the pet's unique QR is generated immediately after profile save, with Share/Copy Link/Download actions and a suggestion to apply it to the pet's collar.
6. Lands on the **pet's feed** (see Core flow 2), which now also serves as the app's home screen post-onboarding.

## Core flow 2: Pet feed & social layer

Each pet has a profile page combining an identity header with a chronological photo feed:

- **Header:** avatar, @handle, species, post/friend/visit counts, and a status chip (Indoor / Missing).
- **Feed:** photo posts from the owner and other contributors (friends, caretakers, or any finder who scanned the QR), each with a caption and timestamp.
- **Comments:** each post supports threaded comments — open to any finder who has entered a display name, not just registered friends.
- **Moderation:** only the pet's owner sees a "…" menu on posts (regardless of who posted them), giving them centralized delete control over their pet's page — covers the case of a stranger posting something inappropriate after scanning the QR.
- **Posting:** a "+" affordance in the top bar lets anyone with page access add a photo, which is how sighting evidence accumulates during a Missing episode.

## Core flow 3: Missing-pet emergency flow

1. **Owner sets status to Missing** from their own app (the only status-change entry point).
2. Anyone who scans the pet's collar QR while status = Missing sees two prominent actions overlaid on the feed, instead of the normal read-only view:
   - **Share Location on WhatsApp** — opens a WhatsApp chat pre-filled with the finder's Google Maps pin and a "Hurray! I find your Pet, buddy!" message, addressed to the owner's registration phone number.
   - **EMERGENCY! Call nearby Vets** — opens a location-search screen (search by area or "use current location"), then a results list of nearby veterinary clinics, each with a tap-to-call icon.
3. The same **"+" photo upload** affordance lets the finder add a sighting photo directly to the feed.
4. When status is not Missing, none of the emergency actions render — the page behaves as an ordinary social feed.

**Nearby vets — how it's built:** no vet data is hand-entered. A places API (Google Places Nearby Search, or the free OpenStreetMap/Overpass API) is queried with the finder's current coordinates and a category filter (`veterinary_care` / `amenity=veterinary`), returning a list of real clinics. Selecting a specific result triggers a second API call (Place Details) to fetch that clinic's phone number, which is bound to the call icon (`tel:` link).

## Screen inventory

Mapped to the design frames on the "Claude" page of the Purr Figma file (frame names as labeled in the file; some grouped where they represent one flow):

| # | Screen | Purpose |
| --- | --- | --- |
| 1 | Landing / Splash | Brand intro |
| 2 | Login (phone entry) | Owner phone number capture |
| 2 | Login (OTP) | 6-digit verification |
| 3 | Details (profile form) | Owner + pet details, photo, bio |
| 3A | Details (filled state) | Same form, filled-in example |
| 4 | Id, QR | QR generation & share/download |
| 4 | Feed — Indoor status | Pet profile + posts, no emergency overlay |
| 4 | Feed — Missing status | Same feed with emergency action buttons |
| 4 | Feed — Missing status v2 | Alternate compact button treatment |
| — | WhatsApp share screenshot | Reference for the pre-filled location message |
| — | Post detail + comments | Single post view with comment thread |
| — | Location search | "Select a location" (search / use current location) |
| — | Confirm location | Map pin confirm step (adapted from a delivery-app pattern; being reconsidered for a lighter-weight version) |

A dedicated **nearby-vets results list** screen (multiple clinic cards with call icons) is still an open design gap — only the location-input step has been designed so far.

## Technical architecture

**Platform target:** Android first (single React Native / Expo codebase, extendable to iOS later without a rewrite via Expo's cloud build service).

**Client stack:** React Native + Expo, React Navigation for the screen stack.

**Key integrations:**

| Capability | Approach |
| --- | --- |
| Owner auth | Phone number + SMS OTP |
| Finder identity | Lightweight, unverified display-name entry |
| QR generation | Client-side QR library, encoding a link to the pet's profile |
| Nearby vets | Google Places API (Nearby Search + Place Details) or OpenStreetMap/Overpass API, filtered to `veterinary_care` |
| Missing-pet location share | Device geolocation → WhatsApp deep link pre-filled with a Google Maps pin, addressed to the owner's OTP phone number |
| Directions / call | `tel:` links for vet numbers; Maps deep links for directions |

**Data model (informal):** Owner (phone, name, address), Pet (owner\_id, name, species, bio, photo, status: indoor/missing), Post (pet\_id, author\_name, photo, caption, timestamp), Comment (post\_id, author\_name, body, timestamp). No formal backend has been selected yet.

## Open decisions, limitations & risks

- **Owner phone number exposure:** the WhatsApp share flow reuses the owner's login phone number as a public-facing contact once a pet is Missing — a deliberate, accepted trade-off, not a bug.
- **WhatsApp dependency:** the location-share mechanic assumes the finder has WhatsApp installed and is willing to message a stranger's number; no fallback exists for a finder without it.
- **Unverified finder identity:** display names on comments/posts have no uniqueness check — acceptable for this app's stakes, but not suitable if reporting/blocking features are added later.
- **Comment moderation scope:** owner delete-control is confirmed for posts; whether it extends to individual comments (the more likely spot for spam once a QR is scannable by strangers) is still to be decided.
- **Nearby-vets screen:** the results list (multiple clinic cards with call icons) has not been designed yet — only the location-input step exists so far.
- **Places API cost:** Google Places Nearby Search + Place Details are typically two separate, potentially separately-billed calls; OpenStreetMap/Overpass is a free fallback with spottier data coverage in some areas.

## Build plan / next steps (Android MVP)

1. Scaffold the Expo/React Native project in `/Users/satyampanwar/Desktop/Projects/Purr` (in progress).
2. Wire navigation across the screen stack from Onboarding → QR → Feed → Emergency flow.
3. Build screens matching the design references: splash, phone/OTP auth, profile form, QR generation.
4. Build the feed: posts, owner-only "…" moderation menu, comments.
5. Build the missing-pet emergency overlay: status toggle (owner side), WhatsApp share deep link, location search → nearby vets results (new screen to design), call/directions actions.
6. Verify the app builds and runs on Android via Expo Go / EAS Build, with no build errors.
7. Resolve the open decisions above before locking the data model.
