import { PushNotifications } from '@capacitor/push-notifications';

export async function initPushNotifications(userId) {
  try {
    const permission = await PushNotifications.requestPermissions();
    if (permission.receive !== 'granted') return;

    await PushNotifications.register();

    // Get FCM token and send to server
    await PushNotifications.addListener('registration', async (token) => {
      console.log('FCM Token:', token.value);
      try {
        await fetch('https://app.showmine.ng/api/v2/notifications.php?action=register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Auth-Token': localStorage.getItem('showmine_token') || '' },
          credentials: 'include',
          body: JSON.stringify({ token: token.value, user_id: userId }),
        });
      } catch (e) {}
    });

    // Handle foreground notifications
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
    });

    // Handle notification tap
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data;
      if (data?.url) {
        window.location.href = data.url;
      }
    });

  } catch (e) {
    console.log('Push notifications not available:', e);
  }
}