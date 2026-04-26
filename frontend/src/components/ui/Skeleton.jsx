import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ width = '100%', height = '20px', className = '' }) => {
  return (
    <motion.div
      className={`bg-slate-200 dark:bg-slate-800 rounded-xl ${className}`}
      style={{ width, height }}
      animate={{ 
        opacity: [0.4, 0.7, 0.4],
        backgroundColor: [
          'rgba(226, 232, 240, 1)', 
          'rgba(241, 245, 249, 1)', 
          'rgba(226, 232, 240, 1)'
        ] 
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
};

export default Skeleton;