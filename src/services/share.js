// Native share sheet on Android/iOS (Capacitor Share), Web Share or clipboard on the web.
export async function shareMovie(movie) {
  const url = `https://v2.showmine.ng/watch/${movie.slug}`;
  const text = `Watch "${movie.title}" on Showmine — African movies, series & live sports.`;
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: movie.title, text, url, dialogTitle: 'Share with friends' });
      return;
    }
    if (navigator.share) { await navigator.share({ title: movie.title, text, url }); return; }
    await navigator.clipboard?.writeText(`${text} ${url}`);
    alert('Link copied!');
  } catch { /* user cancelled */ }
}
