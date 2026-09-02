# ADR 0014: Globe 3D Performance Optimization and Label Level-of-Detail (LOD)

## Status
Accepted

## Context
When navigating the 3D interactive Earth globe, users experienced stuttering (*frame drops / jank*) during mouseover interactions and camera rotations.
Profiling identified 4 main culprits:
1. **Unfiltered 3D Text Pin Sprites**: 195+ text labels rendered simultaneously on the globe sphere, generating hundreds of draw calls per frame at `labelResolution(3)`.
2. **Hover Event Thrashing**: Un-throttled `onPolygonHover` events triggered full polygon vertex buffer recalculations on every single mousemove pixel.
3. **Polygon Transition Stacking**: 250ms elevation animations accumulated during swift cursor movement across contiguous borders.
4. **Device Pixel Ratio (DPR) Uncapped**: WebGL rendered at 2.0x–3.0x on Retina and 4K screens, pushing 4x–9x pixel rasterization load onto the GPU.

## Decision
1. **Label Level-of-Detail (LOD)**:
   - Filter `labelsData` to display only the top 24 major global currencies (e.g. IDR, USD, EUR, JPY, GBP, SGD, AUD, CNY, SAR, MYR) by default, plus the currently hovered or selected country.
   - Reduces label draw calls by ~85% while keeping the globe readable and uncluttered.
2. **Hover Deduplication Guard**:
   - Track `lastHoveredIso3` in `Globe3DView.svelte` to prevent redundant polygon altitude and color re-evaluations when the mouse moves within the same country polygon.
3. **Instant Zero-Jank Transitions**:
   - Set `polygonsTransitionDuration(0)` for immediate, lag-free polygon elevation highlighting.
4. **Renderer Pixel Ratio Clamping**:
   - Configure `renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))` on the Three.js WebGL renderer.
5. **Optimized Label Resolution**:
   - Adjust `labelResolution(2)` to cut canvas texture memory in half.

## Consequences
- **Positive**: Fluid 60 FPS interactions, eliminated frame drops during mouse hover, reduced GPU thermal/battery impact, and cleaner map presentation.
- **Visuals**: Primary trading currencies remain clearly pinned, while any country dynamically displays its pin on hover or click.
