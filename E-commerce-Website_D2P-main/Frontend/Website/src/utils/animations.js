// Animation variants và utilities cho Framer Motion

// Page transitions
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
}

// Fade in animation
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

// Slide in from bottom
export const slideInUp = {
  initial: { opacity: 0, y: 50 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: 50,
    transition: {
      duration: 0.3,
    },
  },
}

// Slide in from right
export const slideInRight = {
  initial: { opacity: 0, x: 100 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

// Slide in from left
export const slideInLeft = {
  initial: { opacity: 0, x: -100 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

// Scale animation
export const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
}

// Stagger children animation
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Stagger item
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
}

// Hover scale
export const hoverScale = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: 'easeOut',
  },
}

// Hover lift (for cards)
export const hoverLift = {
  y: -8,
  boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
  transition: {
    duration: 0.3,
    ease: 'easeOut',
  },
}

// Pulse animation
export const pulse = {
  scale: [1, 1.1, 1],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

// Rotate animation
export const rotate = {
  rotate: 360,
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
}

// Shake animation
export const shake = {
  x: [0, -10, 10, -10, 10, 0],
  transition: {
    duration: 0.5,
  },
}

// Bounce animation
export const bounce = {
  y: [0, -20, 0],
  transition: {
    duration: 0.6,
    ease: 'easeOut',
  },
}

// Fade in with delay
export const fadeInDelay = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay,
      ease: 'easeOut',
    },
  },
})

// Spring animation config
export const springConfig = {
  type: 'spring',
  stiffness: 100,
  damping: 15,
  mass: 1,
}

// Smooth spring config
export const smoothSpring = {
  type: 'spring',
  stiffness: 50,
  damping: 20,
}

// Quick spring config
export const quickSpring = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
}

