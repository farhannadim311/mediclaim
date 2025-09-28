import React from 'react';

/**
 * Fullscreen splash shown on first load for ~4s. No navbar during splash.
 */
const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] text-white overflow-hidden">
      {/* Sunrise gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900 to-black">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 120% 60% at 50% 100%, 
                rgba(251, 146, 60, 0.4) 0%, 
                rgba(245, 158, 11, 0.3) 25%, 
                rgba(217, 119, 6, 0.2) 40%, 
                rgba(0, 0, 0, 0.8) 60%, 
                rgba(0, 0, 0, 1) 80%
              ),
              linear-gradient(to top, 
                rgba(251, 146, 60, 0.1) 0%, 
                transparent 30%
              )
            `,
            opacity: 0,
            animation: 'sunriseGlow 3000ms 2700ms ease-out forwards',
          }}
        />
      </div>

      {/* Text sequence - positioned in upper portion */}
      <div className="absolute inset-0 flex flex-col items-center justify-start pt-[25vh] pointer-events-none">
        <div className="text-center px-6 max-w-2xl">
          <p
            className="text-3xl md:text-4xl opacity-0"
            style={{ animation: 'textFade 1500ms ease-out 300ms forwards, textOut 600ms ease-in 2400ms forwards' }}
          >
            In healthcare claims verification...
          </p>
          <p
            className="mt-4 text-3xl md:text-4xl font-semibold tracking-wide opacity-0"
            style={{ animation: 'textFade 1200ms ease-out 2700ms forwards, textOut 600ms ease-in 4200ms forwards' }}
          >
            Privacy and proof unite with ZK technology.
          </p>
        </div>
      </div>

      {/* Collision stage - positioned in center */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'hideAfter5s 800ms 2550ms ease-out both' }}
      >
        <div className="relative w-[400px] h-[120px] md:w-[500px] md:h-[140px]">
          {/* Midnight logo - slides in from left */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2"
            style={{
              opacity: 0,
              transform: 'translateX(-300px) translateY(-50%)',
              animation: 'slideInLeft 1800ms 1200ms cubic-bezier(0.25,1,0.3,1) forwards',
            }}
          >
            <img src="/midnight-logo.png" alt="Midnight" className="h-12 md:h-14 filter drop-shadow-lg" />
          </div>

          {/* Sun circle - slides in from right */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 rounded-full"
            style={{
              background: 'radial-gradient(circle, #fbbf24 20%, #f59e0b 50%, #d97706 80%)',
              boxShadow: '0 0 40px 8px rgba(251,191,36,0.4)',
              opacity: 0,
              transform: 'translateX(300px) translateY(-50%)',
              animation: 'slideInRight 1800ms 1200ms cubic-bezier(0.25,1,0.3,1) forwards',
            }}
          />

          {/* Collision impact effects */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* Energy burst */}
            <div
              className="absolute w-20 h-20 rounded-full bg-white"
              style={{
                opacity: 0,
                animation: 'energyBurst 750ms 3000ms ease-out forwards',
              }}
            />

            {/* Shockwave rings */}
            <div
              className="absolute w-4 h-4 rounded-full border-2 border-orange-300"
              style={{
                opacity: 0,
                transform: 'translate(-50%, -50%)',
                animation: 'shockwave1 1200ms 3000ms ease-out forwards',
                boxShadow: '0 0 36px 10px rgba(252, 211, 77, 0.25)',
              }}
            />
            <div
              className="absolute w-4 h-4 rounded-full border border-yellow-200"
              style={{
                opacity: 0,
                transform: 'translate(-50%, -50%)',
                animation: 'shockwave2 1500ms 3150ms ease-out forwards',
                boxShadow: '0 0 24px 6px rgba(250, 204, 21, 0.2)',
              }}
            />

            {/* Particle streaks */}
            <div className="absolute left-1/2 top-1/2">
              <div
                className="absolute h-[2px] w-28 bg-gradient-to-r from-white via-amber-200 to-transparent"
                style={{
                  opacity: 0,
                  transform: 'translate(-50%, -50%) rotate(8deg)',
                  animation: 'streak 1050ms 2925ms ease-out forwards',
                }}
              />
              <div
                className="absolute h-[2px] w-32 bg-gradient-to-r from-white via-amber-300 to-transparent"
                style={{
                  opacity: 0,
                  transform: 'translate(-50%, -50%) rotate(-12deg)',
                  animation: 'streak 1080ms 2970ms ease-out forwards',
                }}
              />
              <div
                className="absolute h-[2px] w-24 bg-gradient-to-r from-white via-amber-200 to-transparent"
                style={{
                  opacity: 0,
                  transform: 'translate(-50%, -50%) rotate(25deg)',
                  animation: 'streak 1020ms 3000ms ease-out forwards',
                }}
              />
              <div
                className="absolute h-[2px] w-36 bg-gradient-to-r from-white via-amber-300 to-transparent"
                style={{
                  opacity: 0,
                  transform: 'translate(-50%, -50%) rotate(-28deg)',
                  animation: 'streak 1140ms 2940ms ease-out forwards',
                }}
              />
              <div
                className="absolute h-[2px] w-28 bg-gradient-to-r from-white via-amber-200 to-transparent"
                style={{
                  opacity: 0,
                  transform: 'translate(-50%, -50%) rotate(42deg)',
                  animation: 'streak 1110ms 3030ms ease-out forwards',
                }}
              />
              <div
                className="absolute h-[2px] w-24 bg-gradient-to-r from-white via-amber-200 to-transparent"
                style={{
                  opacity: 0,
                  transform: 'translate(-50%, -50%) rotate(-38deg)',
                  animation: 'streak 1035ms 3075ms ease-out forwards',
                }}
              />
              <div
                className="absolute h-[2px] w-28 bg-gradient-to-r from-white via-amber-300 to-transparent"
                style={{
                  opacity: 0,
                  transform: 'translate(-50%, -50%) rotate(58deg)',
                  animation: 'streak 1065ms 3000ms ease-out forwards',
                }}
              />
              <div
                className="absolute h-[2px] w-28 bg-gradient-to-r from-white via-amber-300 to-transparent"
                style={{
                  opacity: 0,
                  transform: 'translate(-50%, -50%) rotate(-52deg)',
                  animation: 'streak 1080ms 3045ms ease-out forwards',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Impact flash overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.15) 55%, rgba(255,255,255,0) 70%)',
          opacity: 0,
          animation: 'impactFlash 480ms 3000ms ease-out forwards',
        }}
      />

      {/* Post-impact logo reveal */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ opacity: 0, animation: 'revealTitle 1350ms 3600ms cubic-bezier(0.2,0.8,0.2,1) forwards' }}>
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-2">ZK Claim Verifier</h1>
            <p className="text-lg text-blue-400">Privacy-Preserving Healthcare</p>
          </div>
        </div>
      </div>

      {/* Enhanced horizon glow that rises - hidden behind logo reveal */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[180vh] h-[180vh] rounded-full blur-[32px]"
        style={{
          bottom: '-60vh',
          background:
            'radial-gradient(ellipse 80% 40% at center, rgba(251,146,60,0.4) 0%, rgba(245,158,11,0.25) 35%, rgba(217,119,6,0.15) 55%, rgba(0,0,0,0) 75%)',
          opacity: 0,
          animation: 'horizonRise 2700ms 3300ms ease-out forwards',
        }}
      />

      {/* Additional atmospheric layers - hidden behind logo reveal */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[140vh] h-[140vh] rounded-full blur-[16px]"
        style={{
          bottom: '-45vh',
          background:
            'radial-gradient(ellipse 60% 30% at center, rgba(251,191,36,0.3) 0%, rgba(245,158,11,0.2) 40%, rgba(0,0,0,0) 70%)',
          opacity: 0,
          animation: 'horizonRise 2400ms 3600ms ease-out forwards',
        }}
      />

      <style>{`
        @keyframes textFade { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes textOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes slideInLeft { 
          0% { opacity: 0; transform: translateX(-300px) translateY(-50%) }
          70% { opacity: 1; transform: translateX(-20px) translateY(-50%) }
          100% { opacity: 1; transform: translateX(80px) translateY(-50%) }
        }
        @keyframes slideInRight { 
          0% { opacity: 0; transform: translateX(300px) translateY(-50%) }
          70% { opacity: 1; transform: translateX(20px) translateY(-50%) }
          100% { opacity: 1; transform: translateX(-80px) translateY(-50%) }
        }
        @keyframes energyBurst {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(3) }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(8) }
        }
        @keyframes shockwave1 {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) }
          30% { opacity: 0.9; transform: translate(-50%, -50%) scale(2.4) }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(6) }
        }
        @keyframes shockwave2 {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3) }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(3.2) }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(7.2) }
        }
        @keyframes dawnEmerge {
          0% { opacity: 0; transform: scale(0.7) rotate(-15deg) }
          60% { opacity: 0.8; transform: scale(1.1) rotate(5deg) }
          100% { opacity: 1; transform: scale(1) rotate(0deg) }
        }
        @keyframes sunriseGlow {
          0% { opacity: 0 }
          50% { opacity: 0.7 }
          100% { opacity: 1 }
        }
        @keyframes horizonRise {
          0% { opacity: 0; bottom: -60vh }
          30% { opacity: 0.3; bottom: -45vh }
          70% { opacity: 0.8; bottom: -25vh }
          100% { opacity: 1; bottom: -15vh }
        }
        @keyframes screenShake {
          0% { transform: translate3d(0, 0, 0) }
          20% { transform: translate3d(-3px, 2px, 0) }
          40% { transform: translate3d(3px, -3px, 0) }
          60% { transform: translate3d(-2px, 3px, 0) }
          80% { transform: translate3d(2px, -2px, 0) }
          100% { transform: translate3d(0, 0, 0) }
        }
        @keyframes impactFlash {
          0% { opacity: 0 }
          10% { opacity: 1 }
          100% { opacity: 0 }
        }
        @keyframes streak {
          0% { opacity: 0; transform: translate(-50%, -50%) scaleX(0.2) }
          10% { opacity: 1 }
          100% { opacity: 0; transform: translate(-50%, -50%) translateX(220px) scaleX(1) }
        }
        @keyframes revealTitle {
          0% { opacity: 0; letter-spacing: -0.04em; filter: blur(4px); transform: scale(0.92) }
          60% { opacity: 1; letter-spacing: 0.02em; filter: blur(0); transform: scale(1.05) }
          100% { opacity: 1; letter-spacing: 0em; transform: scale(1) }
        }
        @keyframes hideAfter5s {
          0% { opacity: 1 }
          100% { opacity: 0 }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
