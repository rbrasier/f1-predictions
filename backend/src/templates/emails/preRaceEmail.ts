import { WeatherForecast } from '../../services/weatherService';

export interface PreRaceEmailData {
  displayName: string;
  raceName: string;
  raceDate: string;
  circuitName: string;
  country: string;
  fp1DateTime: string;
  fp1TimeRemaining: string;
  raceUrl: string;

  // Weather
  weatherFriday: WeatherForecast | null;
  weatherSaturday: WeatherForecast | null;
  weatherSunday: WeatherForecast | null;

  // User's predictions
  userHasSubmittedPrediction: boolean;
  userPredictions?: {
    pole: string | null;
    podium1: string | null;
    podium2: string | null;
    podium3: string | null;
    midfieldHero: string | null;
    crazyPrediction: string | null;
  };

  // Crazy predictions from league
  crazyPredictions: Array<{
    id: number;
    userName: string;
    prediction: string;
    voteUrl: string;
  }>;

  // League standings
  leagueName: string;
  topThree: Array<{
    position: number;
    displayName: string;
    points: number;
  }>;
  userPosition: number | null;
  userPoints: number | null;

  // Recent implemented features
  recentChanges: Array<{
    title: string;
    description: string;
    date: string;
  }>;

  // Unsubscribe
  unsubscribeReminderUrl: string;
}

/**
 * Generate Pre-Race Email HTML Template
 */
export function generatePreRaceEmailHTML(data: PreRaceEmailData): string {
  const weatherRow = (day: string, forecast: WeatherForecast | null) => {
    if (!forecast) {
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${day}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;" colspan="3">Weather data unavailable</td>
        </tr>
      `;
    }

    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;"><strong>${day}</strong></td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${forecast.weather_description}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${Math.round(forecast.temperature_max)}°C / ${Math.round(forecast.temperature_min)}°C</td>
        <td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">${forecast.precipitation_probability}%</td>
      </tr>
    `;
  };

  const predictionsSection = data.userHasSubmittedPrediction && data.userPredictions ? `
    <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <h3 style="color: #e10600; margin-top: 0;">Your Current Predictions</h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${data.userPredictions.pole ? `<tr><td style="padding: 8px;"><strong>Pole Position:</strong></td><td style="padding: 8px;">${data.userPredictions.pole}</td></tr>` : ''}
        ${data.userPredictions.podium1 ? `<tr><td style="padding: 8px;"><strong>1st Place:</strong></td><td style="padding: 8px;">${data.userPredictions.podium1}</td></tr>` : ''}
        ${data.userPredictions.podium2 ? `<tr><td style="padding: 8px;"><strong>2nd Place:</strong></td><td style="padding: 8px;">${data.userPredictions.podium2}</td></tr>` : ''}
        ${data.userPredictions.podium3 ? `<tr><td style="padding: 8px;"><strong>3rd Place:</strong></td><td style="padding: 8px;">${data.userPredictions.podium3}</td></tr>` : ''}
        ${data.userPredictions.midfieldHero ? `<tr><td style="padding: 8px;"><strong>Midfield Hero:</strong></td><td style="padding: 8px;">${data.userPredictions.midfieldHero}</td></tr>` : ''}
        ${data.userPredictions.crazyPrediction ? `<tr><td style="padding: 8px;"><strong>Crazy Prediction:</strong></td><td style="padding: 8px;"><em>${data.userPredictions.crazyPrediction}</em></td></tr>` : ''}
      </table>
      <div style="margin-top: 15px;">
        <a href="${data.raceUrl}" style="background-color: #e10600; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Update Your Predictions</a>
      </div>
    </div>
  ` : `
    <div style="background-color: #fff3cd; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
      <h3 style="color: #856404; margin-top: 0;">You Haven't Submitted Predictions Yet!</h3>
      <p style="margin-bottom: 15px;">Make your predictions before FP1 starts!</p>
      <a href="${data.raceUrl}" style="background-color: #e10600; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Submit Your Predictions Now</a>
    </div>
  `;

  const crazyPredictionsSection = data.crazyPredictions.length > 0 ? `
    <div style="margin: 30px 0;">
      <h3 style="color: #e10600;">Crazy Predictions from Your League</h3>
      <p style="color: #666;">Vote on whether these predictions are legit!</p>
      ${data.crazyPredictions.map(cp => `
        <div style="background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #e10600;">
          <p style="margin: 0 0 10px 0;"><strong>${cp.userName}:</strong> <em>${cp.prediction}</em></p>
          <a href="${cp.voteUrl}" style="background-color: #28a745; color: white; padding: 6px 12px; text-decoration: none; border-radius: 3px; font-size: 14px; margin-right: 8px;">Legit</a>
          <a href="${cp.voteUrl}" style="background-color: #dc3545; color: white; padding: 6px 12px; text-decoration: none; border-radius: 3px; font-size: 14px;">Not Legit</a>
        </div>
      `).join('')}
    </div>
  ` : '';

  const leaderboardSection = `
    <div style="margin: 30px 0;">
      <h3 style="color: #e10600;">${data.leagueName} Standings</h3>
      <table style="width: 100%; border-collapse: collapse; background-color: #fff;">
        <thead>
          <tr style="background-color: #e10600; color: white;">
            <th style="padding: 10px; text-align: left;">Position</th>
            <th style="padding: 10px; text-align: left;">Driver</th>
            <th style="padding: 10px; text-align: right;">Points</th>
          </tr>
        </thead>
        <tbody>
          ${data.topThree.map(entry => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${entry.position}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${entry.displayName}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">${entry.points}</td>
            </tr>
          `).join('')}
          ${data.userPosition && data.userPosition > 3 ? `
            ${data.userPosition > 5 ? '<tr><td colspan="3" style="text-align: center; padding: 10px;">...</td></tr>' : ''}
            <tr style="background-color: #fff3cd;">
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>${data.userPosition}</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>You (${data.displayName})</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;"><strong>${data.userPoints}</strong></td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    </div>
  `;

  const changelogSection = data.recentChanges.length > 0 ? `
    <div style="margin: 30px 0; padding-top: 20px; border-top: 2px solid #e0e0e0;">
      <h3 style="color: #e10600; font-size: 18px;">Recently Implemented Features</h3>
      ${data.recentChanges.map(change => `
        <div style="margin: 15px 0;">
          <p style="margin: 0 0 5px 0; font-weight: bold;">${change.title}</p>
          <p style="margin: 0; color: #666; font-size: 14px;">${change.description}</p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">${new Date(change.date).toLocaleDateString()}</p>
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.raceName} - Race Weekend Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #e10600; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🏁 ${data.raceName}</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">${data.circuitName}, ${data.country}</p>
  </div>

  <div style="background-color: white; padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="color: #e10600; margin-top: 0;">Hi ${data.displayName}! 👋</h2>
    <p>The <strong>${data.raceName}</strong> is coming up this weekend!</p>

    <div style="background-color: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 16px;">⏰ <strong>Prediction Deadline:</strong> ${data.fp1DateTime}</p>
      <p style="margin: 5px 0 0 0; font-size: 18px; color: #155724;"><strong>${data.fp1TimeRemaining}</strong></p>
    </div>

    <h3 style="color: #e10600;">📅 Race Date: ${data.raceDate}</h3>

    <h3 style="color: #e10600; margin-top: 30px;">🌤️ Weather Forecast</h3>
    <table style="width: 100%; border-collapse: collapse; background-color: #fff; margin: 15px 0;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e10600;">Day</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e10600;">Conditions</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e10600;">Temperature</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e10600;">Rain</th>
        </tr>
      </thead>
      <tbody>
        ${weatherRow('Friday', data.weatherFriday)}
        ${weatherRow('Saturday', data.weatherSaturday)}
        ${weatherRow('Sunday', data.weatherSunday)}
      </tbody>
    </table>

    ${predictionsSection}

    ${crazyPredictionsSection}

    ${leaderboardSection}

    ${changelogSection}
  </div>

  <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 10px 0;">You're receiving this because you're registered for F1 Predictions.</p>
    <a href="${data.unsubscribeReminderUrl}" style="color: #666; text-decoration: underline;">Unsubscribe from race reminders</a>
  </div>
</body>
</html>
  `;
}

/**
 * Generate Pre-Race Email Plain Text Version
 */
export function generatePreRaceEmailText(data: PreRaceEmailData): string {
  let text = `
🏁 ${data.raceName}
${data.circuitName}, ${data.country}

Hi ${data.displayName}!

The ${data.raceName} is coming up this weekend!

⏰ PREDICTION DEADLINE: ${data.fp1DateTime}
${data.fp1TimeRemaining}

📅 Race Date: ${data.raceDate}

🌤️ WEATHER FORECAST
`;

  if (data.weatherFriday) {
    text += `\nFriday: ${data.weatherFriday.weather_description}, ${Math.round(data.weatherFriday.temperature_max)}°C / ${Math.round(data.weatherFriday.temperature_min)}°C, ${data.weatherFriday.precipitation_probability}% rain`;
  }
  if (data.weatherSaturday) {
    text += `\nSaturday: ${data.weatherSaturday.weather_description}, ${Math.round(data.weatherSaturday.temperature_max)}°C / ${Math.round(data.weatherSaturday.temperature_min)}°C, ${data.weatherSaturday.precipitation_probability}% rain`;
  }
  if (data.weatherSunday) {
    text += `\nSunday: ${data.weatherSunday.weather_description}, ${Math.round(data.weatherSunday.temperature_max)}°C / ${Math.round(data.weatherSunday.temperature_min)}°C, ${data.weatherSunday.precipitation_probability}% rain`;
  }

  if (data.userHasSubmittedPrediction && data.userPredictions) {
    text += `\n\nYOUR CURRENT PREDICTIONS\n`;
    if (data.userPredictions.pole) text += `Pole Position: ${data.userPredictions.pole}\n`;
    if (data.userPredictions.podium1) text += `1st Place: ${data.userPredictions.podium1}\n`;
    if (data.userPredictions.podium2) text += `2nd Place: ${data.userPredictions.podium2}\n`;
    if (data.userPredictions.podium3) text += `3rd Place: ${data.userPredictions.podium3}\n`;
    if (data.userPredictions.midfieldHero) text += `Midfield Hero: ${data.userPredictions.midfieldHero}\n`;
    if (data.userPredictions.crazyPrediction) text += `Crazy Prediction: ${data.userPredictions.crazyPrediction}\n`;
    text += `\nUpdate your predictions: ${data.raceUrl}`;
  } else {
    text += `\n\n⚠️ YOU HAVEN'T SUBMITTED PREDICTIONS YET!\nSubmit now: ${data.raceUrl}`;
  }

  if (data.crazyPredictions.length > 0) {
    text += `\n\nCRAZY PREDICTIONS FROM YOUR LEAGUE\nVote on these predictions!\n`;
    data.crazyPredictions.forEach(cp => {
      text += `\n${cp.userName}: ${cp.prediction}\nVote: ${cp.voteUrl}\n`;
    });
  }

  text += `\n\n${data.leagueName.toUpperCase()} STANDINGS\n`;
  data.topThree.forEach(entry => {
    text += `${entry.position}. ${entry.displayName} - ${entry.points} pts\n`;
  });

  if (data.userPosition && data.userPosition > 3) {
    if (data.userPosition > 5) text += `...\n`;
    text += `${data.userPosition}. You (${data.displayName}) - ${data.userPoints} pts\n`;
  }

  if (data.recentChanges.length > 0) {
    text += `\n\nRECENTLY IMPLEMENTED FEATURES\n`;
    data.recentChanges.forEach(change => {
      text += `\n${change.title}\n${change.description}\n`;
    });
  }

  text += `\n\n---\nUnsubscribe from race reminders: ${data.unsubscribeReminderUrl}`;

  return text;
}
