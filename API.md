# API Endpoints

All API endpoints are mounted under `/api`.

## Health

- **GET** `/api/health`
  - Response: `200` JSON `{ "status": "ok", "env": "development", "motive": "Making farmers intelligent" }`

## Crops

- **GET** `/api/crops`

  - Returns an array of crop objects.

- **POST** `/api/crops`
  - Body (JSON):
    - `name` (string, required)
    - `plantedAt` (ISO date string, optional)
    - `notes` (string, optional)
  - Success: `201` with created crop object
  - Validation error: `400` with `{ "error": "Field `name` is required" }`

Examples (curl):

```bash
curl http://localhost:4000/api/health

curl http://localhost:4000/api/crops

curl -X POST http://localhost:4000/api/crops \
  -H "Content-Type: application/json" \
  -d '{"name":"Tomato","notes":"fresh matos"}'
```
