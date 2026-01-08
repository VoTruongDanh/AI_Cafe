import { Box } from '@mui/material'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const RunningPanda = ({ isPasswordFocused = false }) => {
  const [lookingAtPassword, setLookingAtPassword] = useState(false)
  const [covering, setCovering] = useState(false)

  useEffect(() => {
    if (isPasswordFocused) {
      // First look at password
      setTimeout(() => setLookingAtPassword(true), 800)
      // Then cover eyes
      setTimeout(() => setCovering(true), 1500)
    } else {
      setLookingAtPassword(false)
      setCovering(false)
    }
  }, [isPasswordFocused])

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: 120,
        overflow: 'hidden',
      }}
    >
      {/* Panda Character */}
      <motion.div
        animate={{
          x: isPasswordFocused 
            ? '50%' 
            : ['0%', '90%', '0%'],
          scaleX: isPasswordFocused 
            ? 1 
            : ['1', '1', '-1', '-1', '1'],
        }}
        transition={{
          x: isPasswordFocused 
            ? { type: 'spring', stiffness: 100, damping: 20, duration: 0.8 }
            : { duration: 8, repeat: Infinity, ease: 'linear' },
          scaleX: isPasswordFocused 
            ? { duration: 0 }
            : { duration: 8, repeat: Infinity, ease: 'linear' },
        }}
        style={{
          position: 'absolute',
          top: '20%',
          left: 0,
          transform: 'translateY(-50%)',
        }}
      >
        <svg width="100" height="90" viewBox="0 0 100 90" fill="none">
          <defs>
            <radialGradient id="pandaWhite">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F5F5F5" />
            </radialGradient>
            <radialGradient id="pandaBlack">
              <stop offset="0%" stopColor="#2C3E50" />
              <stop offset="100%" stopColor="#1a1a1a" />
            </radialGradient>
            <filter id="pandaShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Body */}
          <motion.ellipse
            cx="50"
            cy="50"
            rx="30"
            ry="33"
            fill="url(#pandaWhite)"
            filter="url(#pandaShadow)"
            animate={{
              scaleY: isPasswordFocused ? 1 : [1, 0.95, 1],
            }}
            transition={{
              duration: 0.4,
              repeat: isPasswordFocused ? 0 : Infinity,
            }}
          />

          {/* Head */}
          <motion.circle
            cx="50"
            cy="30"
            r="22"
            fill="url(#pandaWhite)"
            filter="url(#pandaShadow)"
            animate={{
              y: isPasswordFocused ? 0 : [0, -1, 0],
            }}
            transition={{
              duration: 0.4,
              repeat: isPasswordFocused ? 0 : Infinity,
            }}
          />

          {/* Left Ear */}
          <motion.ellipse
            cx="38"
            cy="16"
            rx="7"
            ry="9"
            fill="url(#pandaBlack)"
            animate={{
              rotate: covering ? -15 : lookingAtPassword ? 5 : [0, -8, 0],
            }}
            transition={{
              duration: 0.4,
              repeat: isPasswordFocused ? 0 : Infinity,
            }}
            style={{ transformOrigin: '38px 16px' }}
          />

          {/* Right Ear */}
          <motion.ellipse
            cx="62"
            cy="16"
            rx="7"
            ry="9"
            fill="url(#pandaBlack)"
            animate={{
              rotate: covering ? 15 : lookingAtPassword ? -5 : [0, 8, 0],
            }}
            transition={{
              duration: 0.4,
              repeat: isPasswordFocused ? 0 : Infinity,
            }}
            style={{ transformOrigin: '62px 16px' }}
          />

          {/* Eyes - Normal (blinking) */}
          {!lookingAtPassword && !covering && (
            <motion.g>
              {/* Left Eye */}
              <ellipse cx="42" cy="28" rx="7" ry="9" fill="url(#pandaBlack)" />
              <motion.circle
                cx="43"
                cy="26"
                r="2.5"
                fill="white"
                animate={{
                  scaleY: [1, 0.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />

              {/* Right Eye */}
              <ellipse cx="58" cy="28" rx="7" ry="9" fill="url(#pandaBlack)" />
              <motion.circle
                cx="59"
                cy="26"
                r="2.5"
                fill="white"
                animate={{
                  scaleY: [1, 0.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              />
            </motion.g>
          )}

          {/* Eyes - Looking down at password */}
          {lookingAtPassword && !covering && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Left Eye - looking down */}
              <ellipse cx="42" cy="28" rx="7" ry="9" fill="url(#pandaBlack)" />
              <motion.circle
                cx="43"
                cy="30"
                r="2.5"
                fill="white"
                animate={{
                  y: [0, 1, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              />

              {/* Right Eye - looking down */}
              <ellipse cx="58" cy="28" rx="7" ry="9" fill="url(#pandaBlack)" />
              <motion.circle
                cx="59"
                cy="30"
                r="2.5"
                fill="white"
                animate={{
                  y: [0, 1, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                }}
              />

              {/* Surprised mouth when looking */}
              <motion.ellipse
                cx="50"
                cy="38"
                rx="4"
                ry="5"
                fill="#1a1a1a"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.g>
          )}

          {/* Eyes - Covered (X_X) */}
          {covering && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Left Eye X */}
              <path
                d="M 37 25 L 47 31 M 37 31 L 47 25"
                stroke="#2C3E50"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Right Eye X */}
              <path
                d="M 53 25 L 63 31 M 53 31 L 63 25"
                stroke="#2C3E50"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </motion.g>
          )}

          {/* Nose */}
          {!lookingAtPassword && (
            <ellipse cx="50" cy="36" rx="3" ry="2.5" fill="#1a1a1a" />
          )}

          {/* Mouth - Normal */}
          {!lookingAtPassword && !covering && (
            <motion.g>
              <path
                d="M 50 36 L 50 40"
                stroke="#1a1a1a"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 50 40 Q 45 44, 42 42"
                stroke="#1a1a1a"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 50 40 Q 55 44, 58 42"
                stroke="#1a1a1a"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </motion.g>
          )}

          {/* Mouth - Shy when covering */}
          {covering && (
            <motion.path
              d="M 44 40 Q 50 37, 56 40"
              stroke="#FF6B9D"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}

          {/* Paws covering eyes */}
          {covering && (
            <motion.g
              initial={{ y: -25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
              }}
            >
              {/* Left Paw */}
              <g>
                <ellipse cx="42" cy="28" rx="12" ry="10" fill="url(#pandaBlack)" opacity="0.95" />
                <circle cx="42" cy="30" r="2.5" fill="#4a4a4a" opacity="0.6" />
                <circle cx="39" cy="26" r="1.5" fill="#4a4a4a" opacity="0.6" />
                <circle cx="45" cy="26" r="1.5" fill="#4a4a4a" opacity="0.6" />
              </g>

              {/* Right Paw */}
              <g>
                <ellipse cx="58" cy="28" rx="12" ry="10" fill="url(#pandaBlack)" opacity="0.95" />
                <circle cx="58" cy="30" r="2.5" fill="#4a4a4a" opacity="0.6" />
                <circle cx="55" cy="26" r="1.5" fill="#4a4a4a" opacity="0.6" />
                <circle cx="61" cy="26" r="1.5" fill="#4a4a4a" opacity="0.6" />
              </g>
            </motion.g>
          )}

          {/* Legs - Running animation */}
          {!isPasswordFocused && (
            <motion.g>
              {/* Left Leg */}
              <motion.ellipse
                cx="42"
                cy="75"
                rx="8"
                ry="10"
                fill="url(#pandaBlack)"
                animate={{
                  y: [0, -4, 0],
                  scaleY: [1, 0.8, 1],
                }}
                transition={{
                  duration: 0.35,
                  repeat: Infinity,
                }}
              />

              {/* Right Leg */}
              <motion.ellipse
                cx="58"
                cy="75"
                rx="8"
                ry="10"
                fill="url(#pandaBlack)"
                animate={{
                  y: [0, -4, 0],
                  scaleY: [1, 0.8, 1],
                }}
                transition={{
                  duration: 0.35,
                  repeat: Infinity,
                  delay: 0.175,
                }}
              />
            </motion.g>
          )}

          {/* Legs - Standing still */}
          {isPasswordFocused && (
            <g>
              <ellipse cx="42" cy="75" rx="8" ry="10" fill="url(#pandaBlack)" />
              <ellipse cx="58" cy="75" rx="8" ry="10" fill="url(#pandaBlack)" />
            </g>
          )}

          {/* Dust clouds when running */}
          {!isPasswordFocused && (
            <motion.g opacity="0.4">
              <motion.ellipse
                cx="35"
                cy="80"
                rx="6"
                ry="3"
                fill="#cccccc"
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1.5, 2],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                }}
              />
              <motion.ellipse
                cx="65"
                cy="80"
                rx="6"
                ry="3"
                fill="#cccccc"
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1.5, 2],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: 0.25,
                }}
              />
            </motion.g>
          )}

          {/* Blush when shy */}
          {covering && (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
            >
              <ellipse cx="32" cy="36" rx="5" ry="3" fill="#FFB6C1" />
              <ellipse cx="68" cy="36" rx="5" ry="3" fill="#FFB6C1" />
            </motion.g>
          )}
        </svg>
      </motion.div>

      {/* Status text */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}
      >
        {!isPasswordFocused && (
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              fontSize: '13px',
              color: '#999',
              fontStyle: 'italic',
            }}
          >
            🐾 Chạy qua chạy lại...
          </motion.div>
        )}

        {lookingAtPassword && !covering && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: '13px',
              color: '#667eea',
              fontWeight: 'bold',
            }}
          >
            👀 Ơ! Mật khẩu gì đây?
          </motion.div>
        )}

        {covering && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              fontSize: '13px',
              color: '#FF6B9D',
              fontWeight: 'bold',
            }}
          >
            🙈 Kyaaa~ Đừng nhìn!
          </motion.div>
        )}
      </Box>

      {/* Sweat drops when covering */}
      {covering && (
        <>
          <motion.div
            style={{
              position: 'absolute',
              left: '45%',
              top: '30%',
              fontSize: '20px',
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: [0, 20], opacity: [0, 0.8, 0] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          >
            💧
          </motion.div>
          <motion.div
            style={{
              position: 'absolute',
              left: '60%',
              top: '30%',
              fontSize: '20px',
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: [0, 20], opacity: [0, 0.8, 0] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: 0.6,
              repeatDelay: 0.5,
            }}
          >
            💧
          </motion.div>
        </>
      )}

      {/* Hearts when shy */}
      {covering && (
        <>
          <motion.div
            style={{
              position: 'absolute',
              left: '30%',
              top: '40%',
              fontSize: '18px',
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: [-10, -30], opacity: [0, 1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          >
            💕
          </motion.div>
          <motion.div
            style={{
              position: 'absolute',
              left: '70%',
              top: '40%',
              fontSize: '18px',
            }}
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: [-10, -30], opacity: [0, 1, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: 1,
              repeatDelay: 0.5,
            }}
          >
            💕
          </motion.div>
        </>
      )}
    </Box>
  )
}

export default RunningPanda
