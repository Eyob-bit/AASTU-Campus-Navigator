# AASTU Smart Campus Navigator

# Database Design (Version 1.1)

---

# Overview

The database is the single source of truth for the entire AASTU Smart Campus Navigator.

Every feature in the application—including AI search, outdoor navigation, indoor navigation, office lookup, staff lookup, event navigation, and administration—reads its information from this database.

The administrator only updates the database. Every other system automatically reflects those changes.

---

# Database Tables

1. Admin
2. Building
3. BuildingEntrance
4. Floor
5. Scene
6. SceneObject
7. Office
8. OfficeAssignment
9. Staff
10. Event
11. EventLocation
12. SearchAlias
13. SearchHistory

---

# 1. Admin

Stores the administrator account.

| Field | Type |
|---------|------|
| id | UUID |
| name | String |
| email | String (Unique) |
| passwordHash | String |
| createdAt | DateTime |
| updatedAt | DateTime |

---

# 2. Building

Represents one building inside AASTU.

| Field | Type |
|---------|------|
| id | UUID |
| name | String |
| code | String |
| description | String |
| latitude | Decimal |
| longitude | Decimal |
| coverImage | String |
| createdAt | DateTime |
| updatedAt | DateTime |

Example

Administration Building

Block 76

---

# 3. BuildingEntrance ⭐

A building may have one or more entrances.

Outdoor GPS navigation always ends at an entrance.

Indoor navigation always begins from an entrance.

| Field | Type |
|---------|------|
| id | UUID |
| buildingId | UUID |
| name | String |
| latitude | Decimal |
| longitude | Decimal |
| entranceImage | String |
| firstSceneId | UUID |
| createdAt | DateTime |
| updatedAt | DateTime |

Example

Administration Building

↓

Main Entrance

↓

Entrance Photo

↓

Scene 1

---

# 4. Floor

Each building contains one or more floors.

| Field | Type |
|---------|------|
| id | UUID |
| buildingId | UUID |
| floorNumber | Integer |
| name | String |
| createdAt | DateTime |
| updatedAt | DateTime |

Example

Ground Floor

First Floor

Second Floor

---

# 5. Scene ⭐

A Scene is one indoor navigation image.

A floor contains multiple scenes connected together.

| Field | Type |
|---------|------|
| id | UUID |
| floorId | UUID |
| title | String |
| sceneType | Enum |
| imageUrl | String |
| thumbnail | String |
| order | Integer |
| createdAt | DateTime |
| updatedAt | DateTime |

Scene Types

- ENTRANCE
- CORRIDOR
- INTERSECTION
- LOBBY

Example

Entrance

↓

Main Corridor

↓

Research Corridor

↓

Office Hallway

---

# 6. SceneObject ⭐⭐⭐

The most important table.

Every interactive item placed on a Scene is stored here.

Instead of separate Arrow, Label and Office tables, one flexible table manages everything.

| Field | Type |
|---------|------|
| id | UUID |
| sceneId | UUID |
| type | Enum |
| label | String |
| x | Decimal |
| y | Decimal |
| width | Decimal |
| height | Decimal |
| rotation | Decimal |
| asset | String |
| color | String |
| officeId | UUID (Nullable) |
| targetSceneId | UUID (Nullable) |
| createdAt | DateTime |
| updatedAt | DateTime |

SceneObject Types

- ARROW
- OFFICE
- TEXT
- INFO
- WARNING
- RESTROOM
- EXIT

Coordinates use normalized values.

Example

x = 0.42

y = 0.68

This guarantees responsive positioning on every device.

---

# 7. Office

Represents one office.

| Field | Type |
|---------|------|
| id | UUID |
| floorId | UUID |
| officeNumber | String |
| officeName | String |
| description | String |
| isPublic | Boolean |
| createdAt | DateTime |
| updatedAt | DateTime |

Example

Office 204

Research Directorate

---

# 8. OfficeAssignment ⭐

Connects staff to offices.

This allows office changes without losing historical information.

| Field | Type |
|---------|------|
| id | UUID |
| staffId | UUID |
| officeId | UUID |
| startDate | DateTime |
| endDate | DateTime (Nullable) |
| isCurrent | Boolean |

Example

Mr. X

↓

Office 204

↓

Office 307

The previous assignment remains stored.

---

# 9. Staff

Represents university employees.

| Field | Type |
|---------|------|
| id | UUID |
| fullName | String |
| title | String |
| phone | String |
| email | String |
| photo | String |
| createdAt | DateTime |
| updatedAt | DateTime |

Example

Mr. X

Research Director

---

# 10. Event

Temporary searchable events.

Examples

Exit Exam

Registration

Orientation

Graduation

| Field | Type |
|---------|------|
| id | UUID |
| title | String |
| description | String |
| startDate | DateTime |
| endDate | DateTime |
| createdAt | DateTime |
| updatedAt | DateTime |

The system determines whether an event is active based on the current date and the event's start and end dates.

---

# 11. EventLocation

One event may happen in multiple offices or halls.

| Field | Type |
|---------|------|
| id | UUID |
| eventId | UUID |
| officeId | UUID |

Example

Exit Exam

↓

Hall A

Hall C

Hall F

---

# 12. SearchAlias ⭐⭐⭐

This table powers intelligent search and AI.

Every searchable phrase is stored here.

| Field | Type |
|---------|------|
| id | UUID |
| phrase | String |
| officeId | UUID (Nullable) |
| staffId | UUID (Nullable) |
| eventId | UUID (Nullable) |
| createdAt | DateTime |

Examples

transcript

↓

Registrar Office

fees

↓

Finance Office

research director

↓

Mr. X

exit exam

↓

Exit Exam

This allows administrators to improve search quality without changing office or staff data.

---

# 13. SearchHistory

Stores anonymous search statistics.

Useful for improving search and understanding user needs.

| Field | Type |
|---------|------|
| id | UUID |
| keyword | String |
| resultType | String |
| resultId | UUID |
| searchedAt | DateTime |

Examples

Most searched office

Registrar

Most searched event

Exit Exam

---

# Relationships

Building

↓

BuildingEntrance

↓

Scene

Building

↓

Floor

↓

Scene

↓

SceneObject

Floor

↓

Office

Office

↓

OfficeAssignment

↓

Staff

Event

↓

EventLocation

↓

Office

SearchAlias

↓

Office

OR

↓

Staff

OR

↓

Event

---

# Indoor Navigation Architecture

The indoor navigation system is graph-based.

Each Scene represents a node.

Each ARROW SceneObject represents a connection to another Scene using targetSceneId.

Example

Scene 1

↓

Scene 2

↓

Scene 3

↓

Scene 4

Future buildings with multiple corridors and branches are supported naturally without changing the database.

---

# AI Search Flow

User

↓

Natural Language Search

↓

SearchAlias

↓

Office / Staff / Event

↓

Best Match

↓

Navigation Starts

The AI never invents information.

Every answer comes directly from the database.

---

# Admin Workflow

Admin Login

↓

Manage Buildings

↓

Manage Floors

↓

Manage Entrances

↓

Upload Scenes

↓

Place Scene Objects

↓

Manage Offices

↓

Manage Staff

↓

Manage Events

↓

Save

All application features immediately reflect database changes.

---

# Design Principles

- One administrator manages the entire system.
- The database is the single source of truth.
- Outdoor navigation ends at a building entrance.
- Indoor navigation begins from a building entrance.
- Indoor navigation uses connected Scenes instead of indoor GPS.
- Search is powered by SearchAlias.
- SceneObjects create flexible interactive indoor maps.
- Office history is preserved through OfficeAssignment.
- Coordinates use normalized values for responsive positioning.
- AI retrieves information only from the database.

---

Version

1.1

Status

Approved for Development