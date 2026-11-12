# Annotation list: design spec

Reference: dwv-simplistic
[`annotationComponent.js`](https://github.com/ivmartel/dwv-simplistic/blob/main/src/lib/annotationComponent.js)
(spec: [`annotationComponent.md`](https://github.com/ivmartel/dwv-simplistic/blob/main/doc/design/annotationComponent.md))

## Purpose

Lists the loaded annotation groups and their annotations, and lets the user
navigate to, inspect and edit them. The list only displays the annotation
state: it holds no annotation data itself, and every action goes through the
annotation service.

## Placement

Shown in the right side panel, above any other panel content.

## Data

- Reads the annotation state:
  - `groups`: the annotation groups, in order of addition. Each group has a
    data id, an editable flag, a labels visible flag and its annotations.
  - `selected`: the selected annotation (`{dataId, annotationId}`), if any.
- Each annotation has an id (tracking UID), a label (tracking id), a colour,
  a shape name, a viewable flag, a visible flag and its quantification.
- Local view state: which annotations have their quantification details
  expanded. It is not persisted and not shared.

## Structure

```text
groupList
└─ group                      (one per annotation group)
   ├─ groupHeader
   │  ├─ "group #<dataId>"
   │  └─ actions: lock · save · labels
   └─ annotationList
      ├─ annotation           (one per annotation)
      │  ├─ content button: shape icon + label
      │  ├─ actions: info · colour · visibility · delete
      │  └─ details           (when expanded)
      │     └─ quantGroup*: title + "shortLabel value" items
      └─ empty "No annotation"
```

Annotation element id: `annotationgroup<dataId>-annotation<annotationId>`.
The details element id is the same id prefixed with `qd-`.

## Group header actions

| Action | Icon (on / off) | Behaviour | Disabled when |
| --- | --- | --- | --- |
| Lock | open lock / closed lock | Toggles group editability | never |
| Save | floppy disk | Downloads the group as DICOM SR, `dicom-sr-<dataId>.dcm` | never |
| Labels | label / crossed label | Toggles the labels on the canvas | never |

## Annotation row

- **Content button** (shape icon and label): selects the annotation and moves
  the view to its centroid.
- **Shape icon**: depends on the shape; unknown shapes use a question mark.

  | Shape | Icon |
  | --- | --- |
  | ruler | ruler |
  | arrow | diagonal arrow |
  | rectangle | rectangle |
  | circle | circle outline |
  | ellipse | ellipse |
  | protractor | set square |
  | roi | polyline |

- **Label**: the annotation tracking id, on one line with an ellipsis.

| Action | Control | Behaviour | Disabled when |
| --- | --- | --- | --- |
| Info | info icon button | Expands or collapses the quantification details | never |
| Colour | native `input[type=color]` | Changes the colour, undoable | group locked |
| Visibility | eye / crossed eye | Shows or hides the annotation on its draw layers | never |
| Delete | bin icon button | Deletes the annotation, undoable, without confirmation | group locked |

## States

| State | Trigger | Visual |
| --- | --- | --- |
| Default | none | Raised surface background, 4px radius |
| Hover | pointer over the row | Background darkened with 8% of the text colour |
| Selected | the annotation is the selected one | Secondary accent container background and matching text colour |
| Not viewable | the annotation has no view controller on the current view | Label struck through |
| Toggle on | lock / labels / visibility / info pressed | Primary container background, icon in the on primary container colour (through `aria-pressed="true"`) |
| Empty group | no annotations | Italic "No annotation" in the secondary text colour |
| No quantification | details open, no numeric values | Italic "No quantification" |

When the selection changes, from the list or from the canvas, the selected row
is scrolled into view (`scrollIntoView({block: 'nearest'})`) after rendering.

## Quantification details

- Values that are undefined or not numbers are skipped (e.g. surface on
  uncalibrated data).
- Values are split into two groups, and empty groups are dropped:
  - **Pixel values**: `min`, `max`, `mean`, `stddev`, `median`, `p25`, `p75`.
  - **Geometry**: every other key.
- Each item shows a short label and the value; the full label is in the
  `title` tooltip.
  - Full labels: `stddev` is "standard deviation", `surface` is "area",
    `pNN` is "NNth percentile", and camelCase keys become lower case words.
  - Short labels: the lowercase quantification key (for ex `stddev`, `p25`),
    except `surface` which is "area".
- Value format: 1 decimal if |v| ≥ 100, 3 if 0 < |v| < 1, otherwise 2. The
  unit is translated with dwv `i18n`, with no space before `°`.

## Visual style

| Element | Style |
| --- | --- |
| Base text | Medium body text |
| Group name | Large label text |
| Details text | Small body text |
| Quantification group title | Medium label text |
| Quantification short label | Secondary text colour at 70% opacity, 0.9em |
| Action icon buttons | 28px hit area, 18px icon |
| Shape icon | 18px |
| Colour swatch | 20×20px, 4px horizontal margin |
| Spacing | 8px between groups, 4px between rows, 8px left padding |

## Accessibility

- Every action has a `title`, which also gives it its accessible name.
- Toggle buttons expose `aria-pressed`: lock is pressed when the group is
  locked, labels and visibility when hidden, info when expanded.
- The info button also sets `aria-expanded` and `aria-controls`, pointing to
  the details element.
- The row content is a real `<button>`, so it is reachable by keyboard.


