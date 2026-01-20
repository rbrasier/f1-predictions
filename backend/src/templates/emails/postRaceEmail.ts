export interface PostRaceEmailData {
  displayName: string;
  raceName: string;
  raceDate: string;
  circuitName: string;
  country: string;

  // User's results
  userPoints: number;
  userPredictions?: {
    pole: string | null;
    poleCorrect: boolean;
    podium1: string | null;
    podium1Correct: boolean;
    podium2: string | null;
    podium2Correct: boolean;
    podium3: string | null;
    podium3Correct: boolean;
    midfieldHero: string | null;
    midfieldHeroCorrect: boolean;
    crazyPrediction: string | null;
  };

  // Round results
  topScorer: {
    displayName: string;
    points: number;
  };
  leagueName: string;
  roundResults: Array<{
    position: number;
    displayName: string;
    points: number;
  }>;

  // Crazy predictions to confirm
  crazyPredictionsToConfirm: Array<{
    id: number;
    userName: string;
    prediction: string;
    confirmUrl: string;
  }>;

  // Next race
  nextRace: {
    name: string;
    date: string;
    daysUntil: number;
  } | null;

  // Unsubscribe
  unsubscribeResultsUrl: string;
}

/**
 * Generate Post-Race Email HTML Template
 */
export function generatePostRaceEmailHTML(data: PostRaceEmailData): string {
  const predictionRow = (label: string, prediction: string | null, correct: boolean) => {
    if (!prediction) return '';

    const icon = correct ? '✅' : '❌';
    const bgColor = correct ? '#d4edda' : '#f8d7da';

    return `
      <tr style="background-color: ${bgColor};">
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;"><strong>${label}</strong></td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${prediction}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; font-size: 20px;">${icon}</td>
      </tr>
    `;
  };

  const userResultsSection = data.userPredictions ? `
    <div style="margin: 30px 0;">
      <h3 style="color: #e10600;">Your Performance</h3>
      <table style="width: 100%; border-collapse: collapse; background-color: #fff; margin: 15px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e10600;">Category</th>
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e10600;">Your Prediction</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e10600;">Result</th>
          </tr>
        </thead>
        <tbody>
          ${predictionRow('Pole Position', data.userPredictions.pole, data.userPredictions.poleCorrect)}
          ${predictionRow('1st Place', data.userPredictions.podium1, data.userPredictions.podium1Correct)}
          ${predictionRow('2nd Place', data.userPredictions.podium2, data.userPredictions.podium2Correct)}
          ${predictionRow('3rd Place', data.userPredictions.podium3, data.userPredictions.podium3Correct)}
          ${predictionRow('Midfield Hero', data.userPredictions.midfieldHero, data.userPredictions.midfieldHeroCorrect)}
        </tbody>
      </table>
      ${data.userPredictions.crazyPrediction ? `
        <div style="background-color: #f9f9f9; padding: 15px; margin-top: 15px; border-radius: 6px; border-left: 3px solid #e10600;">
          <p style="margin: 0;"><strong>Your Crazy Prediction:</strong> <em>${data.userPredictions.crazyPrediction}</em></p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Did it come true? We'll need to confirm this!</p>
        </div>
      ` : ''}
    </div>
  ` : `
    <div style="background-color: #f8d7da; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc3545;">
      <p style="margin: 0; color: #721c24;">You didn't submit predictions for this race. Don't miss the next one!</p>
    </div>
  `;

  const crazyPredictionsSection = data.crazyPredictionsToConfirm.length > 0 ? `
    <div style="margin: 30px 0;">
      <h3 style="color: #e10600;">Did These Crazy Predictions Come True?</h3>
      <p style="color: #666;">Help us verify these crazy predictions from your league:</p>
      ${data.crazyPredictionsToConfirm.map(cp => `
        <div style="background-color: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 3px solid #e10600;">
          <p style="margin: 0 0 10px 0;"><strong>${cp.userName}:</strong> <em>${cp.prediction}</em></p>
          <a href="${cp.confirmUrl}&came_true=true" style="background-color: #28a745; color: white; padding: 6px 12px; text-decoration: none; border-radius: 3px; font-size: 14px; margin-right: 8px;">Yes, it happened!</a>
          <a href="${cp.confirmUrl}&came_true=false" style="background-color: #dc3545; color: white; padding: 6px 12px; text-decoration: none; border-radius: 3px; font-size: 14px;">No, it didn't</a>
        </div>
      `).join('')}
    </div>
  ` : '';

  const nextRaceSection = data.nextRace ? `
    <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 30px 0; border-radius: 4px;">
      <h3 style="color: #0c5460; margin-top: 0;">🏁 Next Race</h3>
      <p style="margin: 5px 0; font-size: 18px;"><strong>${data.nextRace.name}</strong></p>
      <p style="margin: 5px 0; color: #0c5460;">${data.nextRace.date} (in ${data.nextRace.daysUntil} days)</p>
      <p style="margin: 10px 0 0 0; font-size: 14px;">Get ready to submit your predictions!</p>
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.raceName} - Results</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #e10600; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 28px;">🏁 ${data.raceName} Results</h1>
    <p style="margin: 10px 0 0 0; font-size: 16px;">${data.circuitName}, ${data.country}</p>
  </div>

  <div style="background-color: white; padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="color: #e10600; margin-top: 0;">Hi ${data.displayName}! 🎉</h2>
    <p>The <strong>${data.raceName}</strong> is complete! Here's how you did:</p>

    <div style="background-color: ${data.userPoints > 0 ? '#d4edda' : '#f8d7da'}; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
      <h2 style="margin: 0; font-size: 36px; color: #e10600;">${data.userPoints} Points</h2>
      <p style="margin: 10px 0 0 0; font-size: 16px; color: #666;">You scored this round</p>
    </div>

    ${userResultsSection}

    <div style="margin: 30px 0;">
      <h3 style="color: #e10600;">🏆 ${data.leagueName} - Round Results</h3>
      <div style="background-color: #fff3cd; padding: 15px; margin: 15px 0; border-radius: 6px;">
        <p style="margin: 0; font-size: 16px;"><strong>Top Scorer:</strong> ${data.topScorer.displayName} with ${data.topScorer.points} points!</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; background-color: #fff; margin: 15px 0;">
        <thead>
          <tr style="background-color: #e10600; color: white;">
            <th style="padding: 10px; text-align: left;">Position</th>
            <th style="padding: 10px; text-align: left;">Driver</th>
            <th style="padding: 10px; text-align: right;">Points</th>
          </tr>
        </thead>
        <tbody>
          ${data.roundResults.map((entry, index) => {
            const isUser = entry.displayName === data.displayName;
            return `
              <tr style="${isUser ? 'background-color: #fff3cd;' : ''}">
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${index + 1}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${isUser ? `<strong>${entry.displayName} (You)</strong>` : entry.displayName}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">${entry.points}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    ${crazyPredictionsSection}

    ${nextRaceSection}
  </div>

  <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
    <p style="margin: 0 0 10px 0;">You're receiving this because you're registered for F1 Predictions.</p>
    <a href="${data.unsubscribeResultsUrl}" style="color: #666; text-decoration: underline;">Unsubscribe from race results</a>
  </div>
</body>
</html>
  `;
}

/**
 * Generate Post-Race Email Plain Text Version
 */
export function generatePostRaceEmailText(data: PostRaceEmailData): string {
  let text = `
🏁 ${data.raceName} RESULTS
${data.circuitName}, ${data.country}

Hi ${data.displayName}!

The ${data.raceName} is complete! Here's how you did:

🎯 YOU SCORED ${data.userPoints} POINTS THIS ROUND

`;

  if (data.userPredictions) {
    text += `YOUR PERFORMANCE\n`;
    if (data.userPredictions.pole) {
      text += `Pole Position: ${data.userPredictions.pole} ${data.userPredictions.poleCorrect ? '✅' : '❌'}\n`;
    }
    if (data.userPredictions.podium1) {
      text += `1st Place: ${data.userPredictions.podium1} ${data.userPredictions.podium1Correct ? '✅' : '❌'}\n`;
    }
    if (data.userPredictions.podium2) {
      text += `2nd Place: ${data.userPredictions.podium2} ${data.userPredictions.podium2Correct ? '✅' : '❌'}\n`;
    }
    if (data.userPredictions.podium3) {
      text += `3rd Place: ${data.userPredictions.podium3} ${data.userPredictions.podium3Correct ? '✅' : '❌'}\n`;
    }
    if (data.userPredictions.midfieldHero) {
      text += `Midfield Hero: ${data.userPredictions.midfieldHero} ${data.userPredictions.midfieldHeroCorrect ? '✅' : '❌'}\n`;
    }
    if (data.userPredictions.crazyPrediction) {
      text += `\nYour Crazy Prediction: ${data.userPredictions.crazyPrediction}\n`;
    }
  } else {
    text += `You didn't submit predictions for this race.\n`;
  }

  text += `\n🏆 ${data.leagueName.toUpperCase()} - ROUND RESULTS\n`;
  text += `Top Scorer: ${data.topScorer.displayName} with ${data.topScorer.points} points!\n\n`;

  data.roundResults.forEach((entry, index) => {
    const isUser = entry.displayName === data.displayName;
    text += `${index + 1}. ${entry.displayName}${isUser ? ' (You)' : ''} - ${entry.points} pts\n`;
  });

  if (data.crazyPredictionsToConfirm.length > 0) {
    text += `\n\nDID THESE CRAZY PREDICTIONS COME TRUE?\n`;
    data.crazyPredictionsToConfirm.forEach(cp => {
      text += `\n${cp.userName}: ${cp.prediction}\nConfirm: ${cp.confirmUrl}\n`;
    });
  }

  if (data.nextRace) {
    text += `\n\n🏁 NEXT RACE\n`;
    text += `${data.nextRace.name}\n`;
    text += `${data.nextRace.date} (in ${data.nextRace.daysUntil} days)\n`;
  }

  text += `\n\n---\nUnsubscribe from race results: ${data.unsubscribeResultsUrl}`;

  return text;
}
