// src/utils/helpers.js
export const getAvatarUrl = (path) => {
  if (!path) return '/default-avatar.jpg'; // Make sure this file exists in your /public folder
  
  // If it's already a full Google URL, don't change it
  if (path.startsWith('http')) return path;

  // REPLACE 'your-project-id' with the actual ID from your Supabase dashboard
  const projectID = 'tadafczeexjcunbnuggz'; 
  
  return `https://${projectID}.supabase.co/storage/v1/object/public/avatars/${path}`;
};