export async function fetchTemplates() {
    const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/templates');
    if (!response.ok) throw new Error('Failed to fetch workouts');
    return response.json();
  }