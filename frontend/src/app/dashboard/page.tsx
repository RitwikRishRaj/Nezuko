"use client";
import React from "react";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import {
  IconSwords,
  IconUsersGroup
} from "@tabler/icons-react";
import SpotlightCard from "@/components/SpotlightCard";

export default function ArenaPage() {
  const router = useRouter();

  const handleModeSelect = (mode: string) => {
    console.log(`Selected mode: ${mode}`);
    // You can add navigation logic here based on the selected mode
    // Example: router.push(`/dashboard/arena/${mode}`);
  };

  return (
    <motion.div 
      className="min-h-screen p-6 bg-gray-900"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="flex flex-col items-center justify-center min-h-[70vh]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1 
          className="text-4xl font-bold text-white mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Select Battle Mode
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* 1v1 Card */}
          <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleModeSelect('1v1')}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="cursor-pointer"
          >
            <SpotlightCard 
              className="h-full bg-transparent border-2 border-sky-300/60 hover:border-sky-200/80 transition-all backdrop-blur-sm"
              spotlightColor="rgba(145, 176, 193, 0.15)"
            >
              <div className="flex flex-col items-center text-center h-full p-8">
                <div className="p-4 bg-blue-700/30 rounded-full mb-6">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-300">
                    <path d="M7.98651 9.49122L5.67712 7.51305C4.15399 6.20286 4.14889 4.30146 3.98633 3.01953C5.65267 3.09861 6.94342 3.24947 8.06745 4.19897L9.24332 5.53489L10.5158 6.96356M19.4573 18.4181L16.4925 15.4183M14.0215 18.4181C14.0441 18.1459 14.2223 17.4401 15.0408 16.6839C15.7751 16.0054 17.3676 14.3794 18.0832 13.6743C18.4886 13.2749 19.1532 12.9947 19.4573 12.9952M15.5683 12.8081L16.9049 14.2869M13.6763 14.4363L15.1705 15.7499M20.4616 17.9803C21.292 17.9819 22.0011 18.5952 21.9995 19.4251C21.9979 20.2549 21.292 20.9825 20.4616 20.981C19.6312 20.9794 18.9908 20.2492 18.9924 19.4194C19.046 18.5936 19.6568 18.0913 20.4616 17.9803Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4.59593 18.393L7.5539 15.5007M4.56157 12.9871C4.83402 13.0092 5.59357 13.1911 6.274 14.0411C6.89872 14.8214 8.58371 16.3306 9.29062 17.0443C9.69102 17.4487 9.97105 18.0891 9.97105 18.393M7.2645 14.2299L15.5035 4.66412C16.8442 3.168 18.7179 3.13531 20.0036 2.99805C19.8918 4.66142 19.7155 5.9481 18.7435 7.05254L8.54959 15.9263M5.00618 19.4988C5.00618 20.3286 4.33301 21.0014 3.5026 21.0014C2.6722 21.0014 1.99902 20.3286 1.99902 19.4988C1.99902 18.6689 2.6722 17.9962 3.5026 17.9962C4.33301 17.9962 5.00618 18.6689 5.00618 19.4988Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">1v1 Duel</h3>
                <p className="text-blue-200 mb-6">Challenge a single opponent in a head-to-head coding battle</p>
                <div className="mt-auto px-6 py-2 bg-blue-600/80 text-white/90 rounded-full text-sm font-medium">
                  Select 1v1
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Team vs Team Card */}
          <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleModeSelect('team-vs-team')}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="cursor-pointer"
          >
            <SpotlightCard 
              className="h-full bg-transparent border-2 border-purple-600/30 hover:border-purple-400/50 transition-all backdrop-blur-sm"
              spotlightColor="rgba(147, 51, 234, 0.1)"
            >
              <div className="flex flex-col items-center text-center h-full p-8">
                <div className="p-4 bg-purple-700/30 rounded-full mb-6">
                  <IconUsersGroup className="h-12 w-12 text-purple-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Team vs Team</h3>
                <p className="text-purple-200 mb-6">Collaborate with teammates in an epic coding showdown</p>
                <div className="mt-auto px-6 py-2 bg-purple-600/80 text-white/90 rounded-full text-sm font-medium">
                  Select Team Battle
                </div>
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}