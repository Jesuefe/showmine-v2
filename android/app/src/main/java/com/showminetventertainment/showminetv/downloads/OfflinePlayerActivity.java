package com.showminetventertainment.showminetv.downloads;

import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.GestureDetector;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.OptIn;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.common.util.UnstableApi;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.hls.HlsMediaSource;
import androidx.media3.ui.PlayerView;

import org.json.JSONObject;

import java.io.File;

/**
 * Plays a downloaded title. Screenshots and screen recording are blocked
 * (FLAG_SECURE), the video is decrypted only in memory, and the licence is
 * checked again before playback starts.
 */
@OptIn(markerClass = UnstableApi.class)
public class OfflinePlayerActivity extends AppCompatActivity {
    public static final String EXTRA_KEY = "key";
    private ExoPlayer player;
    private String key;
    private byte[] contentKey;
    private PlayerView view;
    private TextView seekLeft, seekRight;
    private int seekTotal = 0;
    private int seekDir = 0;
    private long lastSeekAt = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        key = getIntent().getStringExtra(EXTRA_KEY);
        JSONObject m = DlStore.validKey(key) ? DlStore.read(this, key) : null;
        String problem = SecureDownloadsPlugin.playProblem(this, m);
        if (problem != null) { fail(problem); return; }

        File dir = DlStore.dir(this, key);
        try {
            contentKey = DlCrypto.unwrap(m.optString("wrappedKey"));
        } catch (Exception e) {
            fail("This download can’t be opened on this phone. Delete it and download again.");
            return;
        }

        view = new PlayerView(this);
        view.setBackgroundColor(Color.BLACK);
        view.setKeepContentOnPlayerReset(true);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        root.addView(view, new FrameLayout.LayoutParams(-1, -1));
        seekLeft = seekBubble(Gravity.START | Gravity.CENTER_VERTICAL);
        seekRight = seekBubble(Gravity.END | Gravity.CENTER_VERTICAL);
        root.addView(seekLeft);
        root.addView(seekRight);
        setContentView(root);
        setupGestures();
        hideSystemBars();

        player = new ExoPlayer.Builder(this).build();
        view.setPlayer(player);
        HlsMediaSource source = new HlsMediaSource.Factory(new EncryptedDataSource.Factory(dir, contentKey))
                .setAllowChunklessPreparation(true)
                .createMediaSource(new MediaItem.Builder()
                        .setUri(Uri.fromFile(new File(dir, "index.m3u8")))
                        .setMimeType(MimeTypes.APPLICATION_M3U8)
                        .build());
        player.setMediaSource(source);
        long resume = m.optLong("resumeMs", 0);
        if (resume > 5000) player.seekTo(resume - 3000);
        player.addListener(new Player.Listener() {
            @Override public void onPlayerError(PlaybackException error) {
                fail("This download couldn’t be played. Delete it and download again.");
            }
            @Override public void onPlaybackStateChanged(int state) {
                if (state == Player.STATE_ENDED) { DlStore.update(OfflinePlayerActivity.this, key, "resumeMs", 0); finish(); }
            }
        });
        player.prepare();
        player.play();
    }

    private int dp(int v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    private TextView seekBubble(int gravity) {
        TextView t = new TextView(this);
        t.setTextColor(Color.WHITE);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        t.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        t.setGravity(Gravity.CENTER);
        t.setPadding(dp(22), dp(14), dp(22), dp(14));
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0x66000000);
        bg.setCornerRadius(dp(40));
        t.setBackground(bg);
        t.setAlpha(0f);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(-2, -2, gravity);
        lp.leftMargin = dp(56); lp.rightMargin = dp(56);
        t.setLayoutParams(lp);
        return t;
    }

    // Double-tap left/right to jump 10s (taps keep adding while the bubble shows);
    // double-tap in the middle plays/pauses; a single tap shows/hides the controls.
    private void setupGestures() {
        final GestureDetector gd = new GestureDetector(this, new GestureDetector.SimpleOnGestureListener() {
            @Override public boolean onDown(MotionEvent e) { return true; }
            @Override public boolean onSingleTapConfirmed(MotionEvent e) {
                if (System.currentTimeMillis() - lastSeekAt < 900 && sideOf(e) == seekDir) { seekBy(seekDir); return true; }
                if (view.isControllerFullyVisible()) view.hideController(); else view.showController();
                return true;
            }
            @Override public boolean onDoubleTap(MotionEvent e) {
                int side = sideOf(e);
                if (side == 0) {
                    if (player != null) { if (player.isPlaying()) player.pause(); else player.play(); }
                    view.showController();
                } else {
                    seekBy(side);
                }
                return true;
            }
        });
        view.setOnTouchListener((v, ev) -> {
            gd.onTouchEvent(ev);
            if (ev.getAction() == MotionEvent.ACTION_UP) v.performClick();
            return true;
        });
    }

    private int sideOf(MotionEvent e) {
        float fx = e.getX() / Math.max(1, view.getWidth());
        return fx < 0.4f ? -1 : (fx > 0.6f ? 1 : 0);
    }

    private void seekBy(int dir) {
        if (player == null) return;
        long now = System.currentTimeMillis();
        if (dir != seekDir || now - lastSeekAt > 900) seekTotal = 0;
        seekDir = dir; lastSeekAt = now; seekTotal += 10;
        long dur = player.getDuration();
        long target = player.getCurrentPosition() + dir * 10_000L;
        if (dur > 0) target = Math.min(target, dur - 500);
        player.seekTo(Math.max(0, target));
        view.hideController();
        TextView t = dir > 0 ? seekRight : seekLeft;
        (dir > 0 ? seekLeft : seekRight).setAlpha(0f);
        t.setText(dir > 0 ? ("▶▶  +" + seekTotal + "s") : ("−" + seekTotal + "s  ◀◀"));
        t.animate().cancel();
        t.setScaleX(0.85f); t.setScaleY(0.85f);
        t.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(120).withEndAction(() ->
            t.animate().alpha(0f).setStartDelay(650).setDuration(250).start()).start();
    }

    private void hideSystemBars() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }

    private void fail(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
        finish();
    }

    private void savePosition() {
        if (player == null || key == null) return;
        long pos = player.getCurrentPosition();
        long dur = player.getDuration();
        if (dur > 0 && pos > dur - 60_000) pos = 0;   // finished: start from the top next time
        DlStore.update(this, key, "resumeMs", pos);
    }

    @Override protected void onPause() { super.onPause(); if (player != null) { savePosition(); player.pause(); } }
    @Override public void onWindowFocusChanged(boolean hasFocus) { super.onWindowFocusChanged(hasFocus); if (hasFocus && player != null) hideSystemBars(); }

    @Override
    protected void onDestroy() {
        if (player != null) { savePosition(); player.release(); player = null; }
        if (contentKey != null) java.util.Arrays.fill(contentKey, (byte) 0);
        super.onDestroy();
    }
}
