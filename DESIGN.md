# Design System Strategy: The Architectural Atmosphere

## 1. Overview & Creative North Star: "The Digital Curator"
This design system is not a utility; it is a gallery. Our Creative North Star is **"The Digital Curator."** We are moving away from the "platform" look—which often feels like a series of data entries—and toward a high-end editorial experience. 

The system achieves a premium feel through **Intentional Asymmetry** and **Tonal Depth**. Rather than a rigid, centered grid, we utilize generous white space and overlapping elements to create a sense of "layered paper." This approach breaks the template-look by treating every event page like a custom-designed invitation.

## 2. Colors: Tonal Architecture
The palette is rooted in our signature `#453B4D` (Primary Container), a deep, intellectual purple that feels more authoritative than black and more sophisticated than navy.

### The "No-Line" Rule
**Designers are prohibited from using 1px solid borders for sectioning.** Boundaries must be defined solely through background color shifts or tonal transitions. To separate a hero section from a content grid, transition from `surface` to `surface-container-low`. The eye should perceive a change in depth, not a mechanical line.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of premium materials. 
*   **Base:** `surface` (#faf9fb) - The canvas.
*   **Structural Sections:** `surface-container-low` (#f4f3f5) - Large layout blocks.
*   **Interactive Cards:** `surface-container-lowest` (#ffffff) - These sit "on top" of the structural sections to create a natural lift.
*   **High-Priority Overlays:** Use `surface-bright` for elements that need to pop against darker backgrounds.

### The "Glass & Gradient" Rule
To move beyond a "standard" flat UI, utilize **Glassmorphism** for floating elements (like Navigation Bars or Quick-Action Menus). Use a semi-transparent `surface` color with a `backdrop-filter: blur(20px)`. 

**Signature Texture:** Apply a subtle linear gradient from `primary` (#2e2536) to `primary_container` (#453b4d) at a 135-degree angle for primary buttons and hero backgrounds. This prevents the "flat-color fatigue" and adds a "silken" visual soul to the interface.

## 3. Typography: Editorial Authority
We utilize two weights of **Manrope** for structure and **Inter** for utility.

*   **Display (LG/MD/SM):** Manrope. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for event titles. It should feel like a magazine header.
*   **Headlines & Titles:** Manrope. These are your anchors. Always use `on_surface` (#1a1c1d) to maintain high-contrast readability.
*   **Body (LG/MD/SM):** Manrope. `body-lg` (1rem) is the workhorse for event descriptions. Maintain a generous line-height (1.6) to ensure the "Sophisticated" aesthetic remains legible.
*   **Labels (MD/SM):** Inter. Reserved for metadata (dates, capacities, tags). The switch to Inter provides a subtle "functional" shift that distinguishes data from narrative.

## 4. Elevation & Depth: The Layering Principle
Depth is achieved through "Tonal Layering" rather than structural shadows.

*   **Ambient Shadows:** For floating cards, use a "Ghost Shadow." 
    *   *Recipe:* `box-shadow: 0 12px 40px rgba(74, 69, 75, 0.06);` 
    *   The shadow is not grey; it is a tinted version of `on-surface-variant` to mimic natural light passing through the deep purple tones of the brand.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge (e.g., in high-contrast modes), use `outline-variant` (#ccc4cc) at **15% opacity**. A 100% opaque border is a failure of the system.
*   **Soft Transitions:** Elements should never "pop" in; they should "float" or "fade" using a `cubic-bezier(0.2, 0, 0, 1)` transition curve—the gold standard for high-end motion.

## 5. Components: Refined Primitives

### Cards (The Signature Component)
*   **Rule:** No dividers. 
*   **Structure:** Use vertical white space (from the `xl` 1.5rem spacing token) to separate the image, title, and metadata. 
*   **Style:** `surface-container-lowest` background with a `xl` (1.5rem) corner radius.

### Buttons
*   **Primary:** Gradient of `primary` to `primary-container`. `full` roundedness. No border. Text is `on_primary` (#ffffff).
*   **Secondary:** No background. `ghost-border` (15% outline-variant). 
*   **Interaction:** On hover, a primary button should subtly scale (1.02x) and increase shadow diffusion.

### Input Fields
*   **Style:** Minimalist. No bottom line. Use `surface-container-high` as a subtle background fill with a `md` (0.75rem) radius.
*   **Focus State:** The background shifts to `surface-container-highest` and the label moves with a smooth, micro-animation.

### Event Chips
*   **Style:** `secondary-container` (#e8dbef) background with `on_secondary_container` (#685f70) text. 
*   **Purpose:** Use for category tags (e.g., "Networking," "Workshop").

## 6. Do's and Don'ts

### Do:
*   **DO** use asymmetric padding. A hero section might have more padding on the left than the right to create an editorial, "off-center" feel.
*   **DO** lean into "Breathing Room." If a layout feels crowded, double the white space.
*   **DO** use high-quality, desaturated imagery that complements the `#453B4D` primary tone.

### Don't:
*   **DON'T** use pure black (#000000) for text. Use `on-surface` (#1a1c1d).
*   **DON'T** use standard Material Design "Drop Shadows." They are too heavy for this brand.
*   **DON'T** use dividers or lines to separate list items. Use a 4px background shift on hover to indicate interactivity.
*   **DON'T** use 90-degree sharp corners. Everything must feel approachable and organic (minimum `sm` radius).