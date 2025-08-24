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
    primary: '#000000',
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
  chart: {
    bw: '#9e7880ff',
    hng: '#727ea5ff',
    pull: '#83a57fff',
  },
} as const;

export type AppColors = typeof colors; 