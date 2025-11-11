// utils/rewardCalculator.js
export const calculateReward = (completionPercent, quizScore) => {
  let reward = 0;

  if (completionPercent >= 100) reward += 100;
  else if (completionPercent >= 80) reward += 50;
  else if (completionPercent >= 50) reward += 25;

  if (quizScore >= 90) reward += 50;
  else if (quizScore >= 75) reward += 25;

  return reward;
};
