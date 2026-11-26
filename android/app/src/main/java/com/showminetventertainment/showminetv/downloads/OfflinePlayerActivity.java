package com.showminetventertainment.showminetv.downloads;

import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
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

        PlayerView view = new PlayerView(this);
        view.setBackgroundColor(Color.BLACK);
        view.setKeepContentOnPlayerReset(true);
        setContentView(view);
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
