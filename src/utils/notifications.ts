import { NotificationManager } from 'react-notifications';

export function display_error(error: any) {
    NotificationManager.error(error.toString(), 'Error');
}

export function display_success(message: string) {
    NotificationManager.success(message, 'Success');
}