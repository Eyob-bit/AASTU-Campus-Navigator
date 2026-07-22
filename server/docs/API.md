# AASTU Campus Navigator API

## Base URL

```
http://localhost:5000/api
```

All successful responses follow this envelope:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

All error responses follow this envelope:

```json
{
  "success": false,
  "message": "..."
}
```

---

## Health Check

### GET /api

**Request**

```
GET /api
```

**Success Response**

```json
{
  "success": true,
  "message": "Server is running"
}
```

---

## Buildings

### Create Building

**POST** `/api/buildings`

**Request**

```json
{
  "name": "Block 76",
  "code": "B76",
  "entranceLatitude": 9.03,
  "entranceLongitude": 38.76
}
```

Optional fields: `entranceImage`, `coverImage`.

**Success** `201`

```json
{
  "success": true,
  "message": "Building created successfully",
  "data": {
    "id": "...",
    "name": "Block 76",
    "code": "B76",
    "entranceLatitude": 9.03,
    "entranceLongitude": 38.76,
    "entranceImage": null,
    "coverImage": null,
    "isActive": true
  }
}
```

### Get All Buildings

**GET** `/api/buildings`

**Success**

```json
{
  "success": true,
  "message": "Buildings retrieved successfully",
  "data": {
    "count": 1,
    "buildings": []
  }
}
```

### Get Single Building

**GET** `/api/buildings/:id`

**Success**

```json
{
  "success": true,
  "message": "Building retrieved successfully",
  "data": {}
}
```

**Errors**

- `404` — Building not found.

### Update Building

**PATCH** `/api/buildings/:id`

**Request** (all fields optional)

```json
{
  "name": "Block 76",
  "code": "B76",
  "entranceLatitude": 9.03,
  "entranceLongitude": 38.76,
  "isActive": true
}
```

**Success**

```json
{
  "success": true,
  "message": "Building updated successfully",
  "data": {}
}
```

### Delete Building

**DELETE** `/api/buildings/:id`

**Success**

```json
{
  "success": true,
  "message": "Building deleted successfully",
  "data": null
}
```

### List Floors in Building

**GET** `/api/buildings/:buildingId/floors`

**Success**

```json
{
  "success": true,
  "message": "Floors retrieved successfully",
  "data": {
    "count": 0,
    "floors": []
  }
}
```

### Create Floor in Building

**POST** `/api/buildings/:buildingId/floors`

**Request**

```json
{
  "floorNumber": 1
}
```

**Success** `201`

```json
{
  "success": true,
  "message": "Floor created successfully",
  "data": {}
}
```

---

## Floors

### Get Single Floor

**GET** `/api/floors/:id`

**Success**

```json
{
  "success": true,
  "message": "Floor retrieved successfully",
  "data": {}
}
```

### Update Floor

**PATCH** `/api/floors/:id`

**Request**

```json
{
  "floorNumber": 2
}
```

**Success**

```json
{
  "success": true,
  "message": "Floor updated successfully",
  "data": {}
}
```

### Delete Floor

**DELETE** `/api/floors/:id`

**Success**

```json
{
  "success": true,
  "message": "Floor deleted successfully",
  "data": null
}
```

### List Offices on Floor

**GET** `/api/floors/:floorId/offices`

**Success**

```json
{
  "success": true,
  "message": "Offices retrieved successfully",
  "data": {
    "count": 0,
    "offices": []
  }
}
```

### Create Office on Floor

**POST** `/api/floors/:floorId/offices`

**Request**

```json
{
  "name": "Registrar Office",
  "roomNumber": "102",
  "description": "Student registration services"
}
```

**Success** `201`

```json
{
  "success": true,
  "message": "Office created successfully",
  "data": {}
}
```

### List Panorama Scenes on Floor

**GET** `/api/floors/:floorId/scenes`

**Success**

```json
{
  "success": true,
  "message": "Scenes retrieved successfully",
  "data": {
    "count": 0,
    "scenes": []
  }
}
```

### Create Panorama Scene on Floor

**POST** `/api/floors/:floorId/scenes`

**Content-Type:** `multipart/form-data`

| Field          | Type    | Required | Description                                      |
| -------------- | ------- | -------- | ------------------------------------------------ |
| `image`        | file    | Yes      | Panorama image (jpeg, jpg, png, webp; max 20 MB) |
| `name`         | string  | Yes      | Display name                                     |
| `key`          | string  | Yes      | Unique lowercase key (letters, numbers, hyphens) |
| `displayOrder` | integer | No       | Defaults to `0`                                  |
| `isEntryScene` | boolean | No       | Defaults to `false`                              |

**Success** `201`

```json
{
  "success": true,
  "message": "Scene created successfully",
  "data": {}
}
```

---

## Offices

### Get Single Office

**GET** `/api/offices/:id`

**Success**

```json
{
  "success": true,
  "message": "Office retrieved successfully",
  "data": {}
}
```

### Update Office

**PATCH** `/api/offices/:id`

**Request** (all fields optional)

```json
{
  "name": "Registrar Office",
  "roomNumber": "102",
  "description": "Updated description"
}
```

**Success**

```json
{
  "success": true,
  "message": "Office updated successfully",
  "data": {}
}
```

### Delete Office

**DELETE** `/api/offices/:id`

**Success**

```json
{
  "success": true,
  "message": "Office deleted successfully",
  "data": null
}
```

### List Staff in Office

**GET** `/api/offices/:officeId/staff`

**Success**

```json
{
  "success": true,
  "message": "Staff members retrieved successfully",
  "data": {
    "count": 0,
    "staff": []
  }
}
```

### Create Staff in Office

**POST** `/api/offices/:officeId/staff`

**Request**

```json
{
  "fullName": "John Doe",
  "position": "Registrar",
  "email": "john.doe@aastu.edu.et",
  "phone": "0911223344"
}
```

**Success** `201`

```json
{
  "success": true,
  "message": "Staff member created successfully",
  "data": {}
}
```

### List Search Aliases for Office

**GET** `/api/offices/:officeId/aliases`

**Success**

```json
{
  "success": true,
  "message": "Office aliases retrieved successfully",
  "data": {
    "count": 0,
    "aliases": []
  }
}
```

### Create Search Alias for Office

**POST** `/api/offices/:officeId/aliases`

**Request**

```json
{
  "alias": "Registrar"
}
```

**Success** `201`

```json
{
  "success": true,
  "message": "Alias created successfully",
  "data": {}
}
```

---

## Staff

### Get Single Staff Member

**GET** `/api/staff/:id`

**Success**

```json
{
  "success": true,
  "message": "Staff member retrieved successfully",
  "data": {}
}
```

### Update Staff Member

**PATCH** `/api/staff/:id`

**Request** (all fields optional)

```json
{
  "fullName": "John Doe",
  "position": "Senior Registrar",
  "email": "john.doe@aastu.edu.et",
  "phone": "0911223344",
  "officeId": "..."
}
```

**Success**

```json
{
  "success": true,
  "message": "Staff member updated successfully",
  "data": {}
}
```

### Delete Staff Member

**DELETE** `/api/staff/:id`

**Success**

```json
{
  "success": true,
  "message": "Staff deleted successfully",
  "data": null
}
```

### List Search Aliases for Staff

**GET** `/api/staff/:staffId/aliases`

**Success**

```json
{
  "success": true,
  "message": "Staff aliases retrieved successfully",
  "data": {
    "count": 0,
    "aliases": []
  }
}
```

### Create Search Alias for Staff

**POST** `/api/staff/:staffId/aliases`

**Request**

```json
{
  "alias": "John Doe"
}
```

**Success** `201`

```json
{
  "success": true,
  "message": "Alias created successfully",
  "data": {}
}
```

---

## Search Alias

### Get Single Alias

**GET** `/api/aliases/:id`

**Success**

```json
{
  "success": true,
  "message": "Alias retrieved successfully",
  "data": {}
}
```

### Update Alias

**PATCH** `/api/aliases/:id`

**Request**

```json
{
  "alias": "Updated Alias"
}
```

**Success**

```json
{
  "success": true,
  "message": "Alias updated successfully",
  "data": {}
}
```

### Delete Alias

**DELETE** `/api/aliases/:id`

**Success**

```json
{
  "success": true,
  "message": "Alias deleted successfully",
  "data": null
}
```

---

## Panorama Scenes

### Get Single Scene

**GET** `/api/scenes/:id`

**Success**

```json
{
  "success": true,
  "message": "Scene retrieved successfully",
  "data": {}
}
```

### Update Scene

**PATCH** `/api/scenes/:id`

**Content-Type:** `multipart/form-data` (image optional)

| Field          | Type    | Required | Description           |
| -------------- | ------- | -------- | --------------------- |
| `image`        | file    | No       | Replacement panorama  |
| `name`         | string  | No       | Display name          |
| `key`          | string  | No       | Unique scene key      |
| `displayOrder` | integer | No       | Sort order on floor   |
| `isEntryScene` | boolean | No       | Mark as entry scene   |

**Success**

```json
{
  "success": true,
  "message": "Scene updated successfully",
  "data": {}
}
```

### Delete Scene

**DELETE** `/api/scenes/:id`

**Success**

```json
{
  "success": true,
  "message": "Scene deleted successfully",
  "data": null
}
```

### List Scene Elements

**GET** `/api/scenes/:sceneId/elements`

**Success**

```json
{
  "success": true,
  "message": "Scene elements retrieved successfully",
  "data": {
    "count": 0,
    "elements": []
  }
}
```

### Create Scene Element

**POST** `/api/scenes/:sceneId/elements`

**Request**

```json
{
  "type": "ARROW",
  "x": 0.5,
  "y": 0.5,
  "rotation": 90,
  "displayOrder": 1,
  "isVisible": true,
  "nextSceneId": "..."
}
```

Element types:

- `ARROW` — requires `nextSceneId`; must not include `officeId` or `label`
- `OFFICE_LABEL` — requires `officeId`; must not include `nextSceneId`
- `INFORMATION` — requires `label`; must not include `officeId` or `nextSceneId`

**Success** `201`

```json
{
  "success": true,
  "message": "Scene element created successfully",
  "data": {}
}
```

---

## Scene Elements

### Get Single Scene Element

**GET** `/api/elements/:id`

**Success**

```json
{
  "success": true,
  "message": "Scene element retrieved successfully",
  "data": {}
}
```

### Update Scene Element

**PATCH** `/api/elements/:id`

**Request** (all fields optional)

```json
{
  "type": "ARROW",
  "x": 0.5,
  "y": 0.5,
  "rotation": 180,
  "displayOrder": 2,
  "isVisible": true,
  "label": null,
  "officeId": null,
  "nextSceneId": "..."
}
```

**Success**

```json
{
  "success": true,
  "message": "Scene element updated successfully",
  "data": {}
}
```

### Delete Scene Element

**DELETE** `/api/elements/:id`

**Success**

```json
{
  "success": true,
  "message": "Scene element deleted successfully",
  "data": null
}
```

---

## Navigation

### Navigation Endpoint

**GET** `/api/navigation/:officeId`

**Example**

```
GET /api/navigation/cmrkdjw320004s78k4vg74ikz
```

**Success**

```json
{
  "success": true,
  "message": "Navigation path generated successfully.",
  "data": {
    "building": {},
    "floor": {},
    "office": {},
    "entryScene": {},
    "destinationScene": {},
    "path": [
      {
        "id": "...",
        "key": "main-hall",
        "name": "Main Hall",
        "imagePath": "...",
        "displayOrder": 1
      }
    ]
  }
}
```

**Errors**

| Status | Message |
| ------ | ------- |
| `400`  | Invalid office id. |
| `404`  | Office not found. |
| `404`  | Entry scene not configured. |
| `404`  | Destination scene not configured. |
| `404`  | Navigation path could not be generated. |
| `500`  | Navigation graph is invalid. |

---

## Search

### Search Endpoint

### Search Campus

**GET** `/api/search?q=query`

**Examples**

```
GET /api/search?q=Registrar
GET /api/search?q=102
GET /api/search?q=John Doe
```

**Success**

```json
{
  "success": true,
  "message": "Search completed successfully.",
  "data": [
    {
      "type": "office",
      "building": {},
      "floor": {},
      "office": {},
      "staff": null,
      "entryScene": {},
      "destinationScene": {}
    }
  ]
}
```

Result `type` is either `"office"` or `"staff"`. Staff results include a populated `staff` object.

**Errors**

| Status | Message |
| ------ | ------- |
| `400`  | Search query must not be empty. |
| `400`  | Search query must be at least 2 characters long |
| `404`  | No matching campus entities found. |
