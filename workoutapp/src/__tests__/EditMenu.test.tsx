import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { fetchTemplates } from '../api/templates';
import EditMenu from '../screens/EditMenu';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

jest.mock('../api/templates');
const mockedFetchTemplates = fetchTemplates as jest.Mock;

type Props = NativeStackScreenProps<RootStackParamList, 'EditMenu'>;

const createMockProps = (): Props => ({
  navigation: {
    goBack: jest.fn(),
    navigate: jest.fn(),
  } as any,
  route: {
    key: 'EditMenuScreen',
    name: 'EditMenu',
    params: undefined,
  },
});

describe('EditMenu screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const props = createMockProps();

  it('shows loading indicator while fetching templates', () => {
    mockedFetchTemplates.mockReturnValue(new Promise(() => {})); // never resolves

    const { getByTestId } = render(<EditMenu {...props} />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('renders workout list when fetchTemplates succeeds', async () => {
    mockedFetchTemplates.mockResolvedValue([
      { _id: '1', name: 'Workout A' },
      { _id: '2', name: 'Workout B' },
    ]);

    const { getByText } = render(<EditMenu {...props} />);

    await waitFor(() => {
      expect(getByText('Workout A')).toBeTruthy();
      expect(getByText('Workout B')).toBeTruthy();
    });
  });

  it('shows error message when fetchTemplates fails', async () => {
    mockedFetchTemplates.mockRejectedValue(new Error('Failed to fetch'));

    const { getByText } = render(<EditMenu {...props} />);

    await waitFor(() => {
      expect(getByText('Failed to fetch')).toBeTruthy();
    });
  });

  it('calls navigation.goBack when close button is pressed', async () => {
    mockedFetchTemplates.mockResolvedValue([]); // return empty list to avoid loading

    const { getByText } = render(<EditMenu {...props} />);

    await waitFor(() => {
      fireEvent.press(getByText('✕'));
      expect(props.navigation.goBack).toHaveBeenCalled();
    });
  });

  it('renders Create and Browse buttons', async () => {
    mockedFetchTemplates.mockResolvedValue([]);

    const { getByText } = render(<EditMenu {...props} />);

    await waitFor(() => {
      expect(getByText('Create')).toBeTruthy();
      expect(getByText('Browse')).toBeTruthy();
    });
  });
});
