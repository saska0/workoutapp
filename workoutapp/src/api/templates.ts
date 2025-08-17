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

export async function fetchSelectedTemplates(token: string) {
  const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/templates/selected', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch selected templates');
  return response.json();
}

export async function updateSelectedTemplates(token: string, selectedTemplateIds: string[]) {
  const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/templates/selected', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ selectedTemplates: selectedTemplateIds }),
  });
  if (!response.ok) throw new Error('Failed to update selected templates');
  return response.json();
}

export async function fetchSharedTemplates(token: string) {
  const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + '/api/templates/shared', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch shared templates');
  return response.json();
}

export async function deleteTemplate(token: string, templateId: string) {
  const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + `/api/templates/${templateId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok && response.status !== 204) throw new Error('Failed to delete template');
  return true;
}

export async function fetchTemplateById(token: string, templateId: string) {
  const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + `/api/templates/${templateId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch template');
  return response.json();
}

export async function updateTemplate(token: string, templateId: string, payload: { name?: string; steps?: any[]; isPublic?: boolean }) {
  const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + `/api/templates/${templateId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to update template');
  return response.json();
}

export async function copyTemplate(token: string, templateId: string) {
  const response = await fetch(process.env.EXPO_PUBLIC_BACKEND_URL + `/api/templates/${templateId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to copy template');
  return response.json();
}