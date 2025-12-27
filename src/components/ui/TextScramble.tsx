'use client';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

export const TextScramble = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10%' });

  // Separamos el texto en caracteres para animarlos individualmente
  const characters = text.split('');

  return (
    <span ref={ref} className={className}>
      {characters.map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, filter: 'blur(0px)' } : {}}
          transition={{
            duration: 0.05,
            delay: index * 0.015, // Efecto cascada rápido
            ease: 'easeOut',
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
};
