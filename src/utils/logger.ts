import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";

// Define custom log format
const customFormat = format.printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

// Create the Winston logger
const logger = createLogger({
  level: "info", // Default logging level
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.splat(),
    customFormat
  ),
  transports: [
    // Console logging
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        customFormat
      ),
    }),
    // Daily rotating file for general logs
    new transports.DailyRotateFile({
      filename: "logs/app-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
    // Separate error logs
    new transports.DailyRotateFile({
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      level: "error",
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// Export the logger
export default logger;
