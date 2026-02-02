import SystemSettings from '../models/SystemSettings.js';

// Cache settings to avoid database calls on every request
let cachedSettings = null;
let lastCacheUpdate = 0;
const CACHE_DURATION = 60000; // 1 minute

const getSettings = async () => {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - lastCacheUpdate) < CACHE_DURATION) {
    return cachedSettings;
  }
  
  try {
    cachedSettings = await SystemSettings.getSettings();
    lastCacheUpdate = now;
    return cachedSettings;
  } catch (error) {
    console.error('Failed to fetch settings for maintenance check:', error);
    // Return default settings if database fails
    return { maintenanceMode: false };
  }
};

// Clear cache when settings are updated
export const clearSettingsCache = () => {
  cachedSettings = null;
  lastCacheUpdate = 0;
};

export const maintenanceMode = async (req, res, next) => {
  try {
    const settings = await getSettings();
    
    // Skip maintenance mode for admin users and admin routes
    const isAdminRoute = req.path.startsWith('/api/admin');
    const isAuthRoute = req.path.startsWith('/api/auth');
    const isPublicSettingsRoute = req.path === '/api/admin/settings/public';
    
    // Allow admin and auth routes even in maintenance mode
    if (isAdminRoute || isAuthRoute || isPublicSettingsRoute) {
      return next();
    }
    
    // Check if maintenance mode is enabled
    if (settings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message: settings.maintenanceMessage || 'System is under maintenance. Please try again later.',
        maintenanceMode: true,
        estimatedDowntime: settings.estimatedDowntime || null
      });
    }
    
    next();
  } catch (error) {
    console.error('Maintenance mode middleware error:', error);
    // Continue normally if there's an error checking maintenance mode
    next();
  }
};

export default maintenanceMode;