export const colors = {
  background: {
    primary: '#333333',
    secondary: '#222222',
    lighter: '#444444'
  },
  
  text: {
    primary: '#ffffff',
    secondary: '#cccccc',
    placeholder: '#666666',
    error: '#ff6b6b',
  },
  
  border: {
    primary: '#444444',
    error: '#ff6b6b',
  },
  
  button: {
    primary: '#007AFF',
    disabled: '#666666',
    activated: '#237e48ff',
    deactivated: '#862c2cff',
    dark: '#111111',
    tileDefault: '#222222',
  },
  
  input: {
    background: '#222222',
    border: '#444444',
    borderError: '#ff6b6b',
  },
} as const;

export type AppColors = typeof colors; 