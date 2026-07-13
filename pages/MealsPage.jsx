import { useState, useEffect } from 'react';

/**
 * KDPT Meals Page — day-unlock version
 *
 * Each email links here with a day number, e.g. kdpersonaltraining.com/meals?day=3
 * That link unlocks Day 3's meals, plus everything before it (Days 1-2).
 * Days after the linked day show as locked cards with a "starts Day X" message.
 *
 * This isn't secure gating (there's no login), it's pacing: since each email only
 * ever links to its own day number, people naturally only see what's arrived in
 * their inbox so far, which is exactly the effect you want.
 *
 * HOW TO ADD YOUR MEAL IMAGES:
 * Put your meal photos in /public/meals/ and update the `image` paths below,
 * same as before.
 */

const days = [
  { day: 1, meals: [
    { image: '/meals/day1-meal1.jpg' }, { image: '/meals/day1-meal2.jpg' }, { image: '/meals/day1-meal3.jpg' },
  ]},
  { day: 2, meals: [
    { image: '/meals/day2-meal1.jpg' }, { image: '/meals/day2-meal2.jpg' }, { image: '/meals/day2-meal3.jpg' },
  ]},
  { day: 3, meals: [
    { image: '/meals/day3-meal1.jpg' }, { image: '/meals/day3-meal2.jpg' }, { image: '/meals/day3-meal3.jpg' },
  ]},
  { day: 4, meals: [
    { image: '/meals/day4-meal1.jpg' }, { image: '/meals/day4-meal2.jpg' }, { image: '/meals/day4-meal3.jpg' },
  ]},
  { day: 5, meals: [
    { image: '/meals/day5-meal1.jpg' }, { image: '/meals/day5-meal2.jpg' }, { image: '/meals/day5-meal3.jpg' },
  ]},
  { day: 6, meals: [
    { image: '/meals/day6-meal1.jpg' }, { image: '/meals/day6-meal2.jpg' }, { image: '/meals/day6-meal3.jpg' },
  ]},
  { day: 7, meals: [
    { image: '/meals/day7-meal1.jpg' }, { image: '/meals/day7-meal2.jpg' }, { image: '/meals/day7-meal3.jpg' },
  ]},
  { day: 8, meals: [
    { image: '/meals/day8-meal1.jpg' }, { image: '/meals/day8-meal2.jpg' }, { image: '/meals/day8-meal3.jpg' },
  ]},
  { day: 9, meals: [
    { image: '/meals/day9-meal1.jpg' }, { image: '/meals/day9-meal2.jpg' }, { image: '/meals/day9-meal3.jpg' },
  ]},
  { day: 10, meals: [
    { image: '/meals/day10-meal1.jpg' }, { image: '/meals/day10-meal2.jpg' }, { image: '/meals/day10-meal3.jpg' },
  ]},
];

export default function MealsPage() {
  const [unlockedDay, setUnlockedDay] = useState(1);
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dayParam = parseInt(params.get('day'), 10);
    if (dayParam && dayParam >= 1 && dayParam <= 10) {
      setUnlockedDay(dayParam);
    }
  }, []);

  return (
    <div className="mp-page">
      <style>{css}</style>

      <div className="mp-header">
        <h1 className="mp-title">Your 10 Days of High Protein Meals</h1>
        <p className="mp-subtitle">
          Day {unlockedDay} of 10 unlocked. A new day arrives with each email.
        </p>
        <div className="mp-progress-track">
          {days.map((d) => (
            <div
              key={d.day}
              className={`mp-progress-seg ${d.day <= unlockedDay ? 'mp-progress-seg-active' : ''}`}
            />
          ))}
        </div>
      </div>

      {days.map(({ day, meals }) => {
        const isUnlocked = day <= unlockedDay;

        if (!isUnlocked) {
          return (
            <section key={day} className="mp-day-section">
              <div className="mp-locked-card">
                <span className="mp-lock-icon">&#128274;</span>
                <div>
                  <p className="mp-locked-title">Day {day}</p>
                  <p className="mp-locked-sub">Unlocks in your Day {day} email</p>
                </div>
              </div>
            </section>
          );
        }

        return (
          <section key={day} className="mp-day-section">
            <h2 className="mp-day-title">Day {day}</h2>
            <div className="mp-meal-grid">
              {meals.map((meal, i) => (
                <div key={i} className="mp-meal-card">
                  <img
                    src={meal.image}
                    alt={`Day ${day} meal ${i + 1}`}
                    className="mp-meal-image"
                    onClick={() => setZoomedImage(meal.image)}
                  />
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {zoomedImage && (
        <div className="mp-lightbox" onClick={() => setZoomedImage(null)}>
          <img src={zoomedImage} alt="" className="mp-lightbox-image" />
        </div>
      )}
    </div>
  );
}

const css = `
.mp-page {
  background: #060606;
  min-height: 100vh;
  padding: 60px 24px 80px;
  font-family: 'Poppins', sans-serif;
}
.mp-header {
  max-width: 680px;
  margin: 0 auto 48px auto;
  text-align: center;
}
.mp-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 30px;
  color: #ffffff;
  margin: 0 0 12px 0;
}
.mp-subtitle {
  color: #999999;
  font-size: 14.5px;
  margin: 0 0 24px 0;
}
.mp-progress-track {
  display: flex;
  gap: 6px;
  max-width: 400px;
  margin: 0 auto;
}
.mp-progress-seg {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #232323;
}
.mp-progress-seg-active { background: #7ED597; }

.mp-day-section {
  max-width: 780px;
  margin: 0 auto 32px auto;
}
.mp-day-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #7ED597;
  margin: 0 0 14px 0;
}
.mp-meal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}
.mp-meal-card {
  background: #0C0C0C;
  border: 1px solid #1C1C1C;
  border-radius: 12px;
  overflow: hidden;
}
.mp-meal-image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

.mp-locked-card {
  background: #0A0A0A;
  border: 1px dashed #262626;
  border-radius: 12px;
  padding: 20px 22px;
  display: flex;
  align-items: center;
  gap: 16px;
}
.mp-lock-icon { font-size: 20px; opacity: 0.5; }
.mp-locked-title {
  color: #777777;
  font-weight: 600;
  font-size: 14px;
  margin: 0 0 2px 0;
}
.mp-locked-sub {
  color: #555555;
  font-size: 12.5px;
  margin: 0;
}

.mp-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  padding: 24px;
}
.mp-lightbox-image {
  max-width: 90%;
  max-height: 90%;
  border-radius: 8px;
}
`;
