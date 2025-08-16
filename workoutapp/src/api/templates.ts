export async function fetchUserTemplates(token: string) {
  const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/templates/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch user templates');
  return response.json();
}

export async function fetchSharedTemplates() {
  const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/templates/shared', {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch shared templates');
  return response.json();
}