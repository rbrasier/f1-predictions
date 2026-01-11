# F1 API Response Structures

This document contains the complete response structures for the 5 primary API endpoints used by the F1 Predictions application.

## 1. Schedule/Races API

**Endpoint:** `GET /{year}.json`
**Example:** `https://api.jolpi.ca/ergast/f1/2026.json`

**Response Structure:**
```json
{
  "MRData": {
    "xmlns": "",
    "series": "f1",
    "url": "https://api.jolpi.ca/ergast/f1/2026.json",
    "limit": "30",
    "offset": "0",
    "total": "24",
    "RaceTable": {
      "season": "2026",
      "Races": [
        {
          "season": "2026",
          "round": "1",
          "url": "https://en.wikipedia.org/wiki/2026_Australian_Grand_Prix",
          "raceName": "Australian Grand Prix",
          "Circuit": {
            "circuitId": "albert_park",
            "url": "https://en.wikipedia.org/wiki/Albert_Park_Circuit",
            "circuitName": "Albert Park Grand Prix Circuit",
            "Location": {
              "lat": "-37.8497",
              "long": "144.968",
              "locality": "Melbourne",
              "country": "Australia"
            }
          },
          "date": "2026-03-08",
          "time": "04:00:00Z",
          "FirstPractice": {
            "date": "2026-03-06",
            "time": "01:30:00Z"
          },
          "SecondPractice": {
            "date": "2026-03-06",
            "time": "05:00:00Z"
          },
          "ThirdPractice": {
            "date": "2026-03-07",
            "time": "01:30:00Z"
          },
          "Qualifying": {
            "date": "2026-03-07",
            "time": "05:00:00Z"
          }
        },
        {
          "season": "2026",
          "round": "2",
          "url": "https://en.wikipedia.org/wiki/2026_Chinese_Grand_Prix",
          "raceName": "Chinese Grand Prix",
          "Circuit": {
            "circuitId": "shanghai",
            "url": "https://en.wikipedia.org/wiki/Shanghai_International_Circuit",
            "circuitName": "Shanghai International Circuit",
            "Location": {
              "lat": "31.3389",
              "long": "121.22",
              "locality": "Shanghai",
              "country": "China"
            }
          },
          "date": "2026-03-15",
          "time": "07:00:00Z",
          "FirstPractice": {
            "date": "2026-03-13",
            "time": "03:30:00Z"
          },
          "Qualifying": {
            "date": "2026-03-14",
            "time": "07:00:00Z"
          },
          "Sprint": {
            "date": "2026-03-14",
            "time": "03:00:00Z"
          },
          "SprintQualifying": {
            "date": "2026-03-13",
            "time": "07:30:00Z"
          }
        }
      ]
    }
  }
}
```

**Key Fields:**
- `MRData.RaceTable.Races[]` - Array of race objects
- `Sprint` and `SprintQualifying` fields indicate sprint weekend (optional)
- All dates are in ISO 8601 format with UTC times

---

## 2. Drivers API

**Endpoint:** `GET /{year}/drivers.json`
**Example:** `https://api.jolpi.ca/ergast/f1/2026/drivers.json`

**Response Structure:**
```json
{
  "MRData": {
    "xmlns": "http://ergast.com/mrd/1.5",
    "series": "f1",
    "url": "https://api.jolpi.ca/ergast/f1/2026/drivers.json",
    "limit": "30",
    "offset": "0",
    "total": "22",
    "DriverTable": {
      "season": "2026",
      "Drivers": [
        {
          "driverId": "max_verstappen",
          "permanentNumber": "33",
          "code": "VER",
          "url": "http://en.wikipedia.org/wiki/Max_Verstappen",
          "givenName": "Max",
          "familyName": "Verstappen",
          "dateOfBirth": "1997-09-30",
          "nationality": "Dutch"
        },
        {
          "driverId": "hamilton",
          "permanentNumber": "44",
          "code": "HAM",
          "url": "http://en.wikipedia.org/wiki/Lewis_Hamilton",
          "givenName": "Lewis",
          "familyName": "Hamilton",
          "dateOfBirth": "1985-01-07",
          "nationality": "British"
        }
      ]
    }
  }
}
```

**Key Fields:**
- `MRData.DriverTable.Drivers[]` - Array of driver objects
- `driverId` - Unique identifier (snake_case)
- `code` - 3-letter driver code (e.g., "VER", "HAM")
- `url` - Wikipedia page URL
- `permanentNumber` - Driver's car number

**Image URL Construction:**
Driver images can be constructed using the pattern:
`https://media.formula1.com/image/upload/f_auto,c_limit,w_1440,q_auto/content/dam/fom-website/drivers/{YEAR}/Portraits/{driverId}.png`

Alternative headshot pattern:
`https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/{YEAR_LETTER}/{code}{permanentNumber}01.png.transform/1col/image.png`

Example: `https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/M/MAXVER01.png.transform/1col/image.png`

---

## 3. Constructors/Teams API

**Endpoint:** `GET /{year}/constructors.json`
**Example:** `https://api.jolpi.ca/ergast/f1/2026/constructors.json`

**Response Structure:**
```json
{
  "MRData": {
    "xmlns": "http://ergast.com/mrd/1.5",
    "series": "f1",
    "url": "https://api.jolpi.ca/ergast/f1/2026/constructors.json",
    "limit": "30",
    "offset": "0",
    "total": "11",
    "ConstructorTable": {
      "season": "2026",
      "Constructors": [
        {
          "constructorId": "red_bull",
          "url": "http://en.wikipedia.org/wiki/Red_Bull_Racing",
          "name": "Red Bull",
          "nationality": "Austrian"
        },
        {
          "constructorId": "ferrari",
          "url": "http://en.wikipedia.org/wiki/Scuderia_Ferrari",
          "name": "Ferrari",
          "nationality": "Italian"
        },
        {
          "constructorId": "mercedes",
          "url": "http://en.wikipedia.org/wiki/Mercedes-Benz_in_Formula_One",
          "name": "Mercedes",
          "nationality": "German"
        },
        {
          "constructorId": "mclaren",
          "url": "http://en.wikipedia.org/wiki/McLaren",
          "name": "McLaren",
          "nationality": "British"
        }
      ]
    }
  }
}
```

**Key Fields:**
- `MRData.ConstructorTable.Constructors[]` - Array of constructor objects
- `constructorId` - Unique identifier (snake_case)
- `name` - Team display name
- `url` - Wikipedia page URL

---

## 4. Driver Standings API

**Endpoint:** `GET /{year}/driverStandings.json` or `GET /{year}/{round}/driverStandings.json`
**Example:** `https://api.jolpi.ca/ergast/f1/2026/driverStandings.json`

**Response Structure:**
```json
{
  "MRData": {
    "xmlns": "http://ergast.com/mrd/1.5",
    "series": "f1",
    "url": "https://api.jolpi.ca/ergast/f1/2026/driverStandings.json",
    "limit": "30",
    "offset": "0",
    "total": "1",
    "StandingsTable": {
      "season": "2026",
      "StandingsLists": [
        {
          "season": "2026",
          "round": "24",
          "DriverStandings": [
            {
              "position": "1",
              "positionText": "1",
              "points": "575",
              "wins": "19",
              "Driver": {
                "driverId": "max_verstappen",
                "permanentNumber": "33",
                "code": "VER",
                "url": "http://en.wikipedia.org/wiki/Max_Verstappen",
                "givenName": "Max",
                "familyName": "Verstappen",
                "dateOfBirth": "1997-09-30",
                "nationality": "Dutch"
              },
              "Constructors": [
                {
                  "constructorId": "red_bull",
                  "url": "http://en.wikipedia.org/wiki/Red_Bull_Racing",
                  "name": "Red Bull",
                  "nationality": "Austrian"
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

**Key Fields:**
- `MRData.StandingsTable.StandingsLists[0].DriverStandings[]` - Array of driver standings
- `position` - Championship position
- `points` - Total points
- `wins` - Number of wins
- `Driver` - Full driver object (same structure as Drivers API)
- `Constructors[]` - Array of constructors (driver's team)

---

## 5. Constructor Standings API

**Endpoint:** `GET /{year}/constructorStandings.json` or `GET /{year}/{round}/constructorStandings.json`
**Example:** `https://api.jolpi.ca/ergast/f1/2026/constructorStandings.json`

**Response Structure:**
```json
{
  "MRData": {
    "xmlns": "http://ergast.com/mrd/1.5",
    "series": "f1",
    "url": "https://api.jolpi.ca/ergast/f1/2026/constructorStandings.json",
    "limit": "30",
    "offset": "0",
    "total": "1",
    "StandingsTable": {
      "season": "2026",
      "StandingsLists": [
        {
          "season": "2026",
          "round": "24",
          "ConstructorStandings": [
            {
              "position": "1",
              "positionText": "1",
              "points": "860",
              "wins": "21",
              "Constructor": {
                "constructorId": "red_bull",
                "url": "http://en.wikipedia.org/wiki/Red_Bull_Racing",
                "name": "Red Bull",
                "nationality": "Austrian"
              }
            },
            {
              "position": "2",
              "positionText": "2",
              "points": "759",
              "wins": "8",
              "Constructor": {
                "constructorId": "ferrari",
                "url": "http://en.wikipedia.org/wiki/Scuderia_Ferrari",
                "name": "Ferrari",
                "nationality": "Italian"
              }
            }
          ]
        }
      ]
    }
  }
}
```

**Key Fields:**
- `MRData.StandingsTable.StandingsLists[0].ConstructorStandings[]` - Array of constructor standings
- `position` - Championship position
- `points` - Total points
- `wins` - Number of wins
- `Constructor` - Full constructor object (same structure as Constructors API)

---

## Bonus: Race Results API

**Endpoint:** `GET /{year}/{round}/results.json`
**Example:** `https://api.jolpi.ca/ergast/f1/2026/1/results.json`

**Response Structure:**
```json
{
  "MRData": {
    "xmlns": "http://ergast.com/mrd/1.5",
    "series": "f1",
    "url": "https://api.jolpi.ca/ergast/f1/2026/1/results.json",
    "limit": "30",
    "offset": "0",
    "total": "20",
    "RaceTable": {
      "season": "2026",
      "round": "1",
      "Races": [
        {
          "season": "2026",
          "round": "1",
          "url": "https://en.wikipedia.org/wiki/2026_Australian_Grand_Prix",
          "raceName": "Australian Grand Prix",
          "Circuit": {},
          "date": "2026-03-08",
          "time": "04:00:00Z",
          "Results": [
            {
              "number": "33",
              "position": "1",
              "positionText": "1",
              "points": "25",
              "Driver": {
                "driverId": "max_verstappen",
                "permanentNumber": "33",
                "code": "VER",
                "url": "http://en.wikipedia.org/wiki/Max_Verstappen",
                "givenName": "Max",
                "familyName": "Verstappen",
                "dateOfBirth": "1997-09-30",
                "nationality": "Dutch"
              },
              "Constructor": {
                "constructorId": "red_bull",
                "url": "http://en.wikipedia.org/wiki/Red_Bull_Racing",
                "name": "Red Bull",
                "nationality": "Austrian"
              },
              "grid": "1",
              "laps": "58",
              "status": "Finished",
              "Time": {
                "millis": "5434687",
                "time": "1:30:34.687"
              },
              "FastestLap": {
                "rank": "1",
                "lap": "54",
                "Time": {
                  "time": "1:24.125"
                },
                "AverageSpeed": {
                  "units": "kph",
                  "speed": "218.345"
                }
              }
            }
          ]
        }
      ]
    }
  }
}
```

---

## Usage Notes

### Accessing Cached Data

All API responses are cached in the `f1_api_cache` table:

```sql
SELECT data_json
FROM f1_api_cache
WHERE resource_type = 'drivers'
  AND season_year = 2026;
```

The `data_json` column contains the complete JSON response as shown above.

### Extracting Driver Images

Driver images are not directly provided by the Ergast/Jolpica API but can be constructed using:

1. **Official F1 Media CDN Pattern:**
   - `https://media.formula1.com/image/upload/f_auto,c_limit,w_1440,q_auto/content/dam/fom-website/drivers/{YEAR}/Portraits/{driverId}.png`
   - Replace `{YEAR}` with current year (e.g., "2026")
   - Replace `{driverId}` with lowercase driver ID from API (e.g., "max_verstappen")

2. **Fallback Pattern:**
   - Use first letter of surname + driver code + car number + "01"
   - Example: M + MAXVER + 01 = `MAXVER01.png`

### Image URL Mapping Strategy

Since the API doesn't provide image URLs, we should:
1. Extract driver data from cached API responses
2. Generate image URLs using the F1 CDN pattern
3. Store generated URLs in the drivers table
4. Use fallback image if CDN image fails to load
