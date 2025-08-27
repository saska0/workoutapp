import { getAuthToken } from './auth';
import { BACKEND_URL } from '../config/runtime';

export async function fetchUserTemplates() {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(`${BACKEND_URL}/api/templates/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch user templates');
  return response.json();
}

export async function fetchSelectedTemplates() {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(`${BACKEND_URL}/api/templates/selected`  , {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch selected templates');
  return response.json();
}

export async function updateSelectedTemplates(selectedTemplateIds: string[]) {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(`${BACKEND_URL}/api/templates/selected`  , {
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

export async function fetchSharedTemplates() {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(`${BACKEND_URL}/api/templates/shared`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch shared templates');
  return response.json();
}

export async function deleteTemplate(templateId: string) {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(`${BACKEND_URL}/api/templates/${templateId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok && response.status !== 204) throw new Error('Failed to delete template');
  return true;
}

export async function fetchTemplateById(templateId: string) {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(`${BACKEND_URL}/api/templates/${templateId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to fetch template');
  return response.json();
}

export async function updateTemplate(templateId: string, payload: { name?: string; steps?: any[]; isPublic?: boolean }) {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(`${BACKEND_URL}/api/templates/${templateId}`, {
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

export async function copyTemplate(templateId: string) {
  const token = await getAuthToken();
  if (!token) throw new Error('No auth token');
  const response = await fetch(`${BACKEND_URL}/api/templates/${templateId}/copy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) throw new Error('Failed to copy template');
  return response.json();
}