# API Error Reference

All error responses use this envelope:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Status Codes

| Status | Meaning |
| ------ | ------- |
| `400`  | Validation Error |
| `404`  | Resource Not Found |
| `500`  | Internal Server Error |

## Examples

### 400 — Validation Error

```json
{
  "success": false,
  "message": "Search query must not be empty."
}
```

```json
{
  "success": false,
  "message": "Invalid office id."
}
```

### 404 — Resource Not Found

```json
{
  "success": false,
  "message": "Office not found."
}
```

```json
{
  "success": false,
  "message": "No matching campus entities found."
}
```

```json
{
  "success": false,
  "message": "Navigation path could not be generated."
}
```

### 500 — Internal Server Error

```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

```json
{
  "success": false,
  "message": "Navigation graph is invalid"
}
```

## Common Error Messages

| Message | Status | Context |
| ------- | ------ | ------- |
| Building not found | `404` | Building CRUD |
| Floor not found | `404` | Floor operations |
| Office not found | `404` | Office, staff, navigation |
| Staff not found | `404` | Staff operations |
| Alias not found | `404` | Alias operations |
| Scene not found | `404` | Panorama scene operations |
| Scene element not found | `404` | Scene element operations |
| Entry scene not configured | `404` | Navigation |
| Destination scene not configured | `404` | Navigation |
| A scene must have one panorama image. | `400` | Scene creation |
| Only jpeg, jpg, png, and webp images are allowed | `400` | Image upload |
| File size must not exceed 20 MB | `400` | Image upload |
