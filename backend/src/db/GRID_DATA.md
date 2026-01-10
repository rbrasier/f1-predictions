# Grid Data System of Record

The `grid-data.json` file is the system of record for F1 grid data. It contains the official lineup information for each season and tracks any mid-season replacements.

## Schema Structure

```json
{
  "YEAR": {
    "season_start": "YYYY-MM-DD",
    "prediction_deadline": "YYYY-MM-DDTHH:mm:ssZ",
    "is_active": boolean,
    "teams": [
      {
        "name": "Team Name",
        "is_top_four": boolean
      }
    ],
    "drivers": [
      {
        "name": "Driver Name",
        "team": "Team Name"
      }
    ],
    "team_principals": [
      {
        "name": "Principal Name",
        "team": "Team Name"
      }
    ],
    "replacements": [
      {
        "type": "driver" | "team_principal",
        "date": "YYYY-MM-DD",
        "team": "Team Name",
        "out": "Person Leaving",
        "in": "Person Joining",
        "reason": "Optional reason"
      }
    ]
  }
}
```

## Replacement Examples

### Driver Replacement Example

When a driver is replaced mid-season:

```json
{
  "type": "driver",
  "date": "2026-06-15",
  "team": "Alpine",
  "out": "Jack Doohan",
  "in": "Paul Aron",
  "reason": "Performance-based change"
}
```

### Team Principal Replacement Example

When a team principal is replaced:

```json
{
  "type": "team_principal",
  "date": "2026-08-01",
  "team": "Williams",
  "out": "James Vowles",
  "in": "Jost Capito",
  "reason": "Management restructure"
}
```

## How Replacements Work

The `getGridAtDate()` function in `utils/gridData.ts` applies replacements chronologically based on the date parameter. This allows the system to:

1. Show the original grid at the start of the season
2. Show the current grid as of today
3. Show the grid as of any specific date during the season

When a replacement is applied:
- For drivers: The driver's name is updated in the team's lineup
- For team principals: The team principal's name is updated for the team

## Adding a Replacement

To add a mid-season replacement:

1. Open `grid-data.json`
2. Find the appropriate season year
3. Add a new entry to the `replacements` array
4. Ensure the date is in `YYYY-MM-DD` format
5. Match the team name exactly as it appears in the `teams` array
6. Match the outgoing person's name exactly as it appears in the `drivers` or `team_principals` array

The replacement will automatically be reflected when calling `getGridAtDate()` with dates on or after the replacement date.
