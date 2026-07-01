# AASTU Campus Navigator Database Design

## Main Models

- Building
- Floor
- Office
- Staff
- SearchAlias
- PanoramaScene
- SceneElement
- Announcement

---

## Relationships

Building
    ├── Floor
    │      ├── Office
    │      │      ├── Staff
    │      │      │      └── SearchAlias
    │      │
    │      └── PanoramaScene
    │              └── SceneElement
    │
    └── Announcement