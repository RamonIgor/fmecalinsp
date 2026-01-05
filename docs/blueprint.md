# **App Name**: CraneCheck

## Core Features:

- Equipment Listing (PWA): Display a list of crane equipments, cached locally for offline access, enabling inspectors to view equipment data even without an internet connection.
- Dynamic Inspection Forms (PWA): Generate dynamic forms based on selected checklists, pulling question definitions to create tailored inspection processes for different crane models.
- Offline Data Sync (PWA): Utilize IndexedDB to store inspection data when offline and automatically sync the 'Sync Queue' with Supabase when internet connection is restored, ensuring data persistence.
- Image Capture and Compression (PWA): Capture and compress images directly within the PWA. Compress images to reduce storage and bandwidth usage before uploading to Supabase, preserving key details while optimizing efficiency.
- Digital Signature Capture (PWA): Capture inspector signatures on-screen, providing a secure and paperless way to confirm inspection completion, enhancing traceability.
- Dashboard Analytics (Web): Display a dashboard showing statistics on inspected vs. pending cranes, and providing criticality filters for management to prioritize critical equipment.
- Automated PDF Report Generation (Web): Tool to generate formatted technical reports (PDFs) using inspection data and attached photos using the LLM to decide the best report.

## Style Guidelines:

- Primary color: Safety yellow (#FFDA63) for high visibility and alert signaling.
- Background color: Dark gray (#333333) for a professional, industrial feel.
- Accent color: Light gray (#D3D3D3) to complement the primary and background, offering neutral highlights.
- Body text: 'Inter', sans-serif. Headline text: 'Space Grotesk', sans-serif.
- Use clear, robust icons from a set like 'Font Awesome' that can be easily recognized in a factory environment.
- Mobile layout prioritized for one-handed use, ensuring that main buttons are easily accessible. Use of Shadcn/UI components is recommended.
- Use loading states with spinners and progress bars to give feedback during data fetching. A clear 'Connection Status' indicator (Online/Offline) will be placed in the app header.