# Right panel: design spec

Reference: dwv-simplistic
[`rightPanel.js`](https://github.com/ivmartel/dwv-simplistic/blob/main/src/lib/rightPanel.js)

## Purpose

Foldable and resizable side panel on the right of the image view. It is a
generic container: it holds no data and only manages its open state and
width. Its content is provided by the parent.

## Placement

Right of the image view, in the same horizontal row, taking the full height
of the content area. The view takes the remaining width and refits whenever
its size changes, for example when the panel opens, closes or is resized.

## Data

Local view state only, not persisted and not shared:

| State | Initial value | Description |
| --- | --- | --- |
| Open | closed | Whether the panel is shown |
| Width | 300px | Panel width when open, kept while closed |
| Resizing | false | A pointer drag resize is in progress |

Width limits:

- Minimum: 200px.
- Maximum: 50% of the window width, rounded, and never below the minimum.
- Every width change is rounded and clamped to these limits.

## Structure

```text
toggleStrip                 (closed only)
└─ toggle
panel                       (id rightPanel)
├─ resizeHandle             (left edge)
└─ panelContent             (fixed to the panel width)
   ├─ panelHeader
   │  └─ toggle             (open only, aligned right)
   └─ panelBody             (scrollable)
      └─ content
```

The panel element is always present; when closed its width is 0. The panel
content keeps the open width, so it does not reflow when the panel closes.
Opening and closing are not animated.

## Toggle

There is a single toggle at a time: in a narrow strip next to the image when
closed, in the panel header when open.

| State | Icon | Title |
| --- | --- | --- |
| Closed | chevron left | "Open panel" |
| Open | chevron right | "Close panel" |

Clicking it opens or closes the panel. As the toggle moves between the strip
and the header, the focus is moved to the new toggle after rendering, so
keyboard users keep their place.

## Resize

The resize handle is a vertical strip on the left edge of the open panel.

- **Pointer**: drag with the primary button. The pointer is captured on the
  handle; moving left widens the panel, moving right narrows it. Other
  buttons are ignored. The drag ends on pointer up or cancel.
- **Keyboard** (handle focused):

  | Key | Behaviour |
  | --- | --- |
  | Arrow left | Widen by 20px |
  | Arrow right | Narrow by 20px |
  | Home | Minimum width |
  | End | Maximum width |

  Other keys are left to the browser.

## States

| State | Trigger | Visual |
| --- | --- | --- |
| Closed | initial, or toggle | Panel width 0, no border; toggle strip shown |
| Open | toggle | Panel at its width, 1px left border |
| Resizing | pointer drag on the handle | No text selection, handle highlighted |
| Handle hover / focus | pointer over or keyboard focus on the handle | Handle filled with the primary colour, no focus outline |

## Visual style

| Element | Style |
| --- | --- |
| Panel and toggle strip background | Surface container colour (fallback: on surface at 12% over transparent) |
| Panel and toggle strip border | 1px left, outline variant colour |
| Toggle | 24px icon button, 18px icon |
| Toggle strip padding | 4px top, 2px left and right |
| Panel header padding | 4px top, 2px right |
| Panel body padding | 0 top, 8px right, bottom and left |
| Resize handle | 6px wide, full height, above the panel content, column resize cursor |
| Overflow | Panel clipped (not scroll-hidden, so focus cannot scroll it sideways and hide the handle); body scrolls vertically |

## Accessibility

- The panel is an `aside`. When closed it is `aria-hidden` and `inert`, so
  its content is neither focusable nor read.
- The toggle has a `title` (its accessible name), `aria-expanded` set to the
  open state and `aria-controls` pointing to the panel.
- The resize handle is a focusable `separator` with:
  - `aria-orientation="vertical"`, `aria-controls` pointing to the panel and
    the "Resize panel" label and title.
  - `aria-valuenow` set to the width, `aria-valuemin` and `aria-valuemax` to
    the width limits.
